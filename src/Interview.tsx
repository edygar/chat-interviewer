import * as React from "react";
import { View, FlatList } from "react-native";
import { useLazyRef } from "./use-lazy-ref";
import Message from "./Message";
import tw from "tailwind-react-native-classnames";
import { useMemo } from "react";

type QuestionInfo = {
  id: string;
  question: string;
  answer?: (value: unknown) => string;
  transform?: (value: unknown, question: QuestionInfo) => unknown;
  validate?: (value: unknown) => string | void;
  input: (setAnswer: (answer: unknown) => void) => React.ReactElement;
};

type LogEntry = {
  id: string;
  timestamp: Date;
  content: string;
  mine?: boolean;
};

type InterviewState = {
  step: Symbol;
  logRegistry: LogEntry[];
  interviewCatalog: InterviewCatalog;
  data: Record<string, unknown>;
};

type InterviewProps = {
  render?: React.ElementType<InterviewRendererProps>;
  interviewerAvatar?: string;
  intervieweeAvatar?: string;
  onComplete: (answers: InterviewState["data"]) => void;
  children: (
    currentState: Pick<InterviewState, "data" | "logRegistry">
  ) => React.ReactElement;
};

type InterviewRendererProps = Pick<InterviewState, "logRegistry"> &
  Pick<InterviewProps, "intervieweeAvatar" | "interviewerAvatar"> & {
    input: React.ReactElement;
  };

type InterviewCatalogEntry = { question: QuestionInfo; answered?: boolean };
type InterviewCatalog = Map<Symbol, InterviewCatalogEntry>;

type InterviewAction =
  | { event: "step_changed"; step: Symbol }
  | { event: "answered"; content: unknown };

/**
 * Finds the first unanswered question on a given `InterviewCatalog`.
 */
function getUnansweredCatalogEntryId(promptsMap: InterviewCatalog) {
  for (const [id, { answered }] of promptsMap.entries()) {
    if (!answered) return id;
  }

  return null;
}

let lastId = -Number.MAX_SAFE_INTEGER;
const inquiryReduce: React.Reducer<InterviewState, InterviewAction> = (
  state: InterviewState,
  payload
) => {
  if (payload.event === "step_changed") {
    return { ...state, step: payload.step };
  }
  const catalogEntry = state.interviewCatalog.get(state.step);
  const content = catalogEntry.question.transform(
    payload.content,
    catalogEntry.question
  );
  const reason = catalogEntry.question.validate(content);
  const logRegistry = state.logRegistry.concat([
    {
      id: String(lastId++),
      timestamp: new Date(),
      content: catalogEntry.question.question,
      mine: false
    },
    {
      id: String(lastId++),
      timestamp: new Date(),
      content: catalogEntry.question.answer(payload.content),
      mine: true
    }
  ]);

  if (reason) {
    logRegistry.push({
      id: String(lastId++),
      timestamp: new Date(),
      content: reason,
      mine: false
    });
    return { ...state, logRegistry };
  }

  catalogEntry.answered = true;

  return {
    ...state,
    logRegistry,
    data: {
      ...state.data,
      [catalogEntry.question.id]: content
    }
  };
};

const InterviewCatalogContext = React.createContext<InterviewCatalog>(null);

export const Question: React.FC<QuestionInfo> = (questionInfo) => {
  const interviewCatalog = React.useContext(InterviewCatalogContext);
  const { current: id } = useLazyRef<Symbol>(() => Symbol("question"));

  interviewCatalog.set(id, {
    ...interviewCatalog.get(id),
    question: questionInfo
  });
  React.useEffect(() => () => interviewCatalog.delete(id), [
    interviewCatalog,
    id
  ]);

  return null;
};

Question.defaultProps = {
  answer: (value: unknown) => String(value),
  transform: (value: unknown) => String(value),
  validate: (value: unknown) => {}
};

const DefaultInterviewRenderer: React.FC<InterviewRendererProps> = ({
  logRegistry,
  input,
  intervieweeAvatar,
  interviewerAvatar
}) => {
  const chat = useMemo(() => logRegistry.slice(0).reverse(), [logRegistry]);
  return (
    <View style={tw`flex-1 justify-end`}>
      <FlatList
        data={chat}
        inverted
        keyExtractor={({ id }) => id}
        renderItem={({ item: message }) => (
          <Message
            avatar={message.mine ? intervieweeAvatar : interviewerAvatar}
            {...message}
          />
        )}
      />
      <View style={tw`flex-none`}>{input ? input : null}</View>
    </View>
  );
};

const InterviewDisplay: React.FC<
  {
    interviewCatalog: InterviewCatalog;
    state: InterviewState;
    update: (action: InterviewAction) => void;
  } & Pick<InterviewProps, "render" | "interviewerAvatar" | "intervieweeAvatar">
> = ({
  state,
  render: InterviewRenderer,
  interviewCatalog: promptsMap,
  interviewerAvatar,
  intervieweeAvatar,
  update
}) => {
  let interviewCatalogEntry: InterviewCatalogEntry;
  if (!state.step) {
    if (state.logRegistry.length === 0) {
      interviewCatalogEntry = promptsMap.values().next().value;
    }
  } else {
    interviewCatalogEntry = promptsMap.get(state.step);
  }

  return (
    <InterviewRenderer
      intervieweeAvatar={intervieweeAvatar}
      interviewerAvatar={interviewerAvatar}
      logRegistry={state.logRegistry.concat(
        interviewCatalogEntry && !interviewCatalogEntry.answered
          ? [
              {
                id: "temp",
                timestamp: new Date(),
                content: interviewCatalogEntry.question.question
              }
            ]
          : []
      )}
      input={
        interviewCatalogEntry && !interviewCatalogEntry.answered ? (
          <React.Fragment key={state.logRegistry.length}>
            {interviewCatalogEntry.question.input((content) => {
              update({
                event: "answered",
                content
              });
            })}
          </React.Fragment>
        ) : null
      }
    />
  );
};

export const Interview: React.FC<InterviewProps> = ({
  render,
  children,
  interviewerAvatar,
  intervieweeAvatar,
  onComplete
}) => {
  const { current: interviewCatalog } = useLazyRef<InterviewCatalog>(
    () => new Map()
  );
  const [state, update] = React.useReducer(inquiryReduce, {
    // exposes the interview catalog to the reducer
    interviewCatalog,

    // starts of an empty state
    step: null,
    logRegistry: [],
    data: {}
  });

  /**
   * Runs on every logRegistry but only after all questions
   * are registered or updated.
   */
  React.useEffect(() => {
    const step = getUnansweredCatalogEntryId(interviewCatalog);
    if (!step) {
      // if no unanswered step was found, calls onCompleted
      onComplete(state.data);
    }

    // if the step remains the same, do nothing
    if (step === state.step) {
      return;
    }

    // if the step has changed, it means the current one has
    // been anwswered
    update({
      event: "step_changed",
      step
    });
  }, [state.logRegistry.length, onComplete]);

  return (
    <InterviewCatalogContext.Provider value={interviewCatalog}>
      {children({ data: state.data, logRegistry: state.logRegistry })}
      <InterviewDisplay
        render={render}
        state={state}
        interviewerAvatar={interviewerAvatar}
        intervieweeAvatar={intervieweeAvatar}
        interviewCatalog={interviewCatalog}
        update={update}
      />
    </InterviewCatalogContext.Provider>
  );
};

Interview.defaultProps = {
  render: DefaultInterviewRenderer
};
