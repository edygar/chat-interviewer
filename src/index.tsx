import * as React from "react";
import {
  SafeAreaView,
  AppRegistry,
  KeyboardAvoidingView,
  Platform
} from "react-native";

import { Interview, Question } from "./Interview";
import Composer from "./Composer";
import Picker from "./Picker";
import tw from "tailwind-react-native-classnames";

const getLabel = ({ label }) => label;
const getValue = ({ value }) => value;

type PickerPromptProps = Omit<React.ComponentProps<typeof Question>, "input"> &
  Pick<React.ComponentProps<typeof Picker>, "choices">;

const PickerPrompt: React.FC<PickerPromptProps> = ({
  choices,
  ...promptProps
}) => (
  <Question
    answer={getLabel}
    transform={getValue}
    {...promptProps}
    input={(set) => <Picker choices={choices} onPick={set} />}
  />
);

const App = () => (
  <SafeAreaView style={tw`flex-1`}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={tw`flex-1`}
    >
      <Interview
        logRegistry={[
          {
            id: "123",
            timestamp: new Date(),
            content: "Olá, seja bem-vindo"
          }
        ]}
        interviewerAvatar="https://reactnative.dev/img/tiny_logo.png"
        onComplete={(answers) => {
          alert(JSON.stringify(answers, undefined, 2));
        }}
      >
        {({ data: answers }) => (
          <>
            <Question
              id="name"
              question="Qual o seu nome?"
              transform={(name: string) => name.trim().toUpperCase()}
              validate={(name) => !name && "Precisamos do seu nome"}
              input={(setAnswer) => (
                <Composer autoFocus onSend={(message) => setAnswer(message)} />
              )}
            />

            <Question
              id="age"
              question="Qual sua idade?"
              transform={(value: string) => parseInt(value, 10)}
              validate={async (age: number) => {
                if (isNaN(age)) {
                  return "Não entendi, idade deve ser um número.";
                }

                if (age < 18) {
                  return "Menores de 18 anos não deveriam fazer plantões";
                }

                await new Promise((resolve) => setTimeout(resolve, 3000));
              }}
              input={(setAnswer) => (
                <Composer
                  keyboardType="number-pad"
                  autoFocus
                  onSend={(message) => {
                    setAnswer(message);
                  }}
                />
              )}
            />

            <PickerPrompt
              id="role"
              question="Qual sua profissão?"
              choices={[
                { label: "Sou um médico", value: "doctor" },
                { label: "Sou um enfermeiro", value: "nurse" },
                { label: "Sou um administrador", value: "admin" },
                { label: "Tenho outra profissão", value: "other" }
              ]}
            />

            {answers.role === "doctor" && (
              <PickerPrompt
                id="role"
                question="Qual a sua especialidade?"
                choices={[
                  { label: "Sou um pneumologista", value: "pneumologist" },
                  {
                    label: "Sou um clínico geral",
                    value: "general_practitioner"
                  }
                ]}
              />
            )}
            {answers.role === "pneumologist" && answers.age < 32 && (
              <Question
                id="age"
                question={`Qual a sua idade mesmo? Eu havia entendido ${answers.age}`}
                transform={(value: string) => parseInt(value, 10)}
                validate={(age: number) => {
                  if (isNaN(age)) {
                    return "Não entendi, idade deve ser um número.";
                  }

                  if (age < 27) {
                    return `Não faz sentido, como pode ser um ${answers.role} tão cedo?`;
                  }
                }}
                input={(setAnswer) => (
                  <Composer
                    keyboardType="number-pad"
                    autoFocus
                    onSend={setAnswer}
                  />
                )}
              />
            )}
          </>
        )}
      </Interview>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
setTimeout(() => {
  try {
    const ids = [];
    for (const iframe of Array.from(document.body.querySelectorAll("iframe"))) {
      if (iframe.id.startsWith("sb__open-sandbox")) ids.push(iframe.id);
    }
    for (const id of ids) {
      const node = document.createElement("div");
      node.style.setProperty("display", "none", "important");
      node.id = id;
      document.getElementById(id).remove();
      document.body.appendChild(node);
    }
  } finally {
  }
}, 1000);

const rootTag = document.getElementById("root");
AppRegistry.registerComponent("App", () => App);
AppRegistry.runApplication("App", { rootTag });
