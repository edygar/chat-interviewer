import * as React from "react";
import { View, StyleSheet } from "react-native";
import { useLazyRef } from "./use-lazy-ref";
import Message from "./Message";

type QuestionInfo = {
  id: string;
  question: string;
  answer?: (value: unknown) => string;
  transform?: (value: unknown, question: QuestionInfo) => unknown;
  validate?: (value: unknown) => string | void;
  input: (setAnswer: (answer: unknown) => void) => React.ReactElement;
};

type LogEntry = {
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
  interviewerAvatar?: string;
  intervieweeAvatar?: string;
  onComplete: (answers: InterviewState["data"]) => void;
  children: (
    currentState: Pick<InterviewState, "data" | "logRegistry">
  ) => React.ReactElement;
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
    { content: catalogEntry.question.question, mine: false },
    {
      content: catalogEntry.question.answer(payload.content),
      mine: true
    }
  ]);

  if (reason) {
    logRegistry.push({ content: reason, mine: false });
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end"
  },
  logRegistry: {
    flex: 1,
    overflow: "scroll",
    justifyContent: "flex-end"
  },

  input: {}
});

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

const InquiryRenderer: React.FC<
  {
    interviewCatalog: InterviewCatalog;
    state: InterviewState;
    update: (action: InterviewAction) => void;
  } & Pick<InterviewProps, "interviewerAvatar" | "intervieweeAvatar">
> = ({
  state,
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
    <View style={styles.container}>
      <View style={styles.logRegistry}>
        {state.logRegistry.map((message, index) => (
          <Message
            avatar={message.mine ? intervieweeAvatar : interviewerAvatar}
            key={index}
            {...message}
          />
        ))}

        {interviewCatalogEntry && !interviewCatalogEntry.answered && (
          <Message
            avatar={interviewerAvatar}
            content={interviewCatalogEntry.question.question}
          />
        )}
      </View>
      {interviewCatalogEntry && !interviewCatalogEntry.answered ? (
        <View key={state.logRegistry.length} style={styles.input}>
          {interviewCatalogEntry.question.input((content) => {
            update({
              event: "answered",
              content
            });
          })}
        </View>
      ) : null}
    </View>
  );
};

export const Interview: React.FC<InterviewProps> = ({
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
      <InquiryRenderer
        state={state}
        interviewerAvatar={interviewerAvatar}
        intervieweeAvatar={intervieweeAvatar}
        interviewCatalog={interviewCatalog}
        update={update}
      />
    </InterviewCatalogContext.Provider>
  );
};
