import { Breadcrumb } from "../globals.jsx";
import { useState } from "react";

const question = {
  id: 1,

  text: "¿En qué año ganaron los Los Angeles Dodgers su primer campeonato de la Serie Mundial después de mudarse de Brooklyn a Los Ángeles?",

  options: [
    {
      id: "A",
      text: "1959",
    },
    {
      id: "B",
      text: "1963",
    },
    {
      id: "C",
      text: "1965",
    },
    {
      id: "D",
      text: "1974",
    },
  ],
};

export default function Trivia() {
  return (
    <>
      <Breadcrumb>INICIO &gt; TRIVIA GENERAL</Breadcrumb>

      <main
        className="
          flex
          min-h-[calc(100vh-100px)]
          items-center
          justify-center

          bg-linear-to-br
          from-[#02112d]
          to-[#08245b]

          px-5
          py-10
        "
      >
        <TriviaCard
          question={question}
          currentQuestion={1}
          totalQuestions={75}
        />
      </main>
    </>
  );
}

//#region TriviaCard

export function TriviaCard({ question, currentQuestion, totalQuestions }) {
  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <section
      className="
        relative
        w-full
        max-w-237.5
        overflow-hidden

        rounded-[28px]
        bg-white

        px-12.5
        py-15

        shadow-2xl
      "
    >
      <DecorativeCircles />

      <div
        className="
          relative
          z-10
          text-center
        "
      >
        <h2
          className="
            mb-6.25
            text-[26px]
            font-bold
            text-black
          "
        >
          Pregunta {currentQuestion}/{totalQuestions}
        </h2>

        <p
          className="
            mx-auto
            mb-11.25
            max-w-200

            text-[22px]
            font-bold
            leading-[1.4]
            text-black
          "
        >
          {question.text}
        </p>

        <div
          className="
            flex
            flex-wrap
            items-center
            justify-center
            gap-10
          "
        >
          {question.options.map((option) => (
            <TriviaOption
              key={option.id}
              option={option}
              selected={selectedOption === option.id}
              onSelect={() => setSelectedOption(option.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DecorativeCircles() {
  return (
    <>
      <div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20

          h-55
          w-55

          rounded-full
          border-18
          border-[#ff2a4b]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-22.5
          -left-20

          h-55
          w-55

          rounded-full
          border-18
          border-[#ff2a4b]
        "
      />
    </>
  );
}

//#endregion

//#region TriviaOption
export function TriviaOption({ option, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        rounded-full
        px-6
        py-2.5

        text-[22px]
        font-bold

        transition-all
        duration-200

        ${
          selected
            ? "bg-[#ff2a4b] text-white"
            : "bg-transparent text-black hover:bg-gray-100"
        }
      `}
    >
      {option.id}) {option.text}
    </button>
  );
}

//#endregion
