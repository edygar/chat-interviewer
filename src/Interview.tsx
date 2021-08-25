import * as React from "react";
import { View, FlatList } from "react-native";
import { useLazyRef } from "./use-lazy-ref";
import Message from "./Message";
import LoadingIcon from "./LoadingIcon";
import tw from "tailwind-react-native-classnames";
import { useMemo } from "react";

type QuestionInfo = {
  id: string;
  question: string;
  answer?: (value: unknown) => string;
  transform?: (
    value: unknown,
    question: QuestionInfo
  ) => unknown | Promise<unknown>;
  validate?: (value: unknown) => string | void | Promise<string | void>;
  input: (setAnswer: (answer: unknown) => void) => React.ReactElement;
};

type LogEntry = {
  id: string;
  timestamp: Date;
  content: string;
  mine?: boolean;
};

type CommonInterviewState = {
  step: Symbol;
  logRegistry: LogEntry[];
  interviewCatalog: InterviewCatalog;
  data: Record<string, unknown>;
};

type InterviewState =
  | (CommonInterviewState & { status: "ready" })
  | (CommonInterviewState & {
      status: "transforming" | "validating";
      pending: Promise<unknown>;
    });

type InterviewProps = {
  render?: React.ElementType<InterviewRendererProps>;
  interviewerAvatar?: string;
  intervieweeAvatar?: string;
  onComplete: (answers: InterviewState["data"]) => void;
  children: (
    currentState: Pick<InterviewState, "data" | "logRegistry">
  ) => React.ReactElement;
};

export type InterviewRendererProps = Pick<InterviewState, "logRegistry"> &
  Pick<InterviewProps, "intervieweeAvatar" | "interviewerAvatar"> & {
    pending: boolean;
    input: React.ReactElement;
  };

type InterviewCatalogEntry = { question: QuestionInfo; answered?: boolean };
type InterviewCatalog = Map<Symbol, InterviewCatalogEntry>;

type InterviewAction =
  | { event: "step_changed"; step: Symbol }
  | { event: "answered"; content: unknown }
  | { event: "transformed"; content: unknown }
  | { event: "validated"; reason: unknown; content: unknown };

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
  let content = payload.content;
  let logRegistry = state.logRegistry;

  if (payload.event === "answered") {
    logRegistry = logRegistry.concat([
      {
        id: String(lastId++),
        timestamp: new Date(),
        content: catalogEntry.question.question,
        mine: false
      },
      {
        id: String(lastId++),
        timestamp: new Date(),
        content: catalogEntry.question.answer(content),
        mine: true
      }
    ]);
    content = catalogEntry.question.transform(content, catalogEntry.question);

    if (content instanceof Promise) {
      return {
        ...state,
        status: "transforming",
        pending: content.then(
          (resolution) => [resolution, payload.content],
          (rejection) => [rejection, payload.content]
        ),
        logRegistry
      };
    }
  }
  let reason;
  if (payload.event === "validated") {
    reason = payload.reason;
    content = payload.content;
  } else {
    reason = catalogEntry.question.validate(content);
    if (reason instanceof Promise) {
      return {
        ...state,
        status: "validating",
        logRegistry,
        pending: reason.then(
          (resolution) => [resolution, content],
          (rejection) => [rejection, content]
        )
      };
    }
  }

  if (reason) {
    logRegistry.push({
      id: String(lastId++),
      timestamp: new Date(),
      content: reason,
      mine: false
    });
    const newState = { ...state, status: "ready", logRegistry };
    if ("pending" in newState) delete newState.pending;
    return newState;
  }

  catalogEntry.answered = true;

  const newState = {
    ...state,
    status: "ready",
    logRegistry,
    data: {
      ...state.data,
      [catalogEntry.question.id]: content
    }
  };
  if ("pending" in newState) delete newState.pending;
  return newState;
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
  pending,
  intervieweeAvatar,
  interviewerAvatar
}) => {
  const chat = useMemo(
    () => [].concat(logRegistry.slice(0), pending ? [pending] : []).reverse(),
    [logRegistry, pending]
  );
  return (
    <View style={tw`flex-1 justify-end`}>
      <FlatList
        data={chat}
        inverted
        keyExtractor={(item) => (item === true ? "pending" : item.id)}
        renderItem={({ item: message }) =>
          message === true ? (
            <Message avatar={interviewerAvatar}>
              <LoadingIcon />
            </Message>
          ) : (
            <Message
              avatar={message.mine ? intervieweeAvatar : interviewerAvatar}
              {...message}
            />
          )
        }
      />
      {input ? <View style={tw`flex-none`}>{input}</View> : null}
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
      pending={"pending" in state}
      logRegistry={
        state.status === "ready"
          ? state.logRegistry.concat(
              interviewCatalogEntry && !interviewCatalogEntry.answered
                ? [
                    {
                      id: "temp",
                      timestamp: new Date(),
                      content: interviewCatalogEntry.question.question
                    }
                  ]
                : []
            )
          : state.logRegistry
      }
      input={
        state.status === "ready" &&
        interviewCatalogEntry &&
        !interviewCatalogEntry.answered ? (
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
    status: "ready",
    // exposes the interview catalog to the reducer
    interviewCatalog,

    // starts of an empty state
    step: null,
    logRegistry: [],
    data: {}
  });

  const pending = "pending" in state && state.pending;
  React.useEffect(() => {
    if (state.status !== "validating" || !pending) return;

    pending.then(
      ([reason, content]) =>
        update({
          event: "validated",
          reason,
          content
        }),
      ([rejection, content]) => {
        console.error(rejection);
        update({
          event: "validated",
          reason: rejection,
          content
        });
      }
    );
  }, [state.status, pending]);

  React.useEffect(() => {
    if (state.status !== "transforming") return;

    pending.then(
      ([content]) =>
        update({
          event: "transformed",
          content
        }),
      ([rejection, content]) => {
        console.error(rejection);
        update({
          event: "transformed",
          content
        });
      }
    );
  }, [state.status, pending]);

  /**
   * Runs on every logRegistry but only after all questions
   * are registered or updated.
   */
  React.useEffect(() => {
    if (state.status !== "ready") return;

    const step = getUnansweredCatalogEntryId(interviewCatalog);
    if (!step && !state.step) {
      // if no unanswered step was found, calls onCompleted
      onComplete(state.data);
      return;
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
  }, [
    state.logRegistry.length,
    onComplete,
    interviewCatalog,
    state.status,
    state.data,
    state.step
  ]);

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
