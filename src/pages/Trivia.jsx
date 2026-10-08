import { Breadcrumb } from "../globals.jsx";
import { useMemo, useState } from "react";
import triviaData from "../json/trivia_opciones.json";

export default function Trivia() {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // Obtener los equipos disponibles
  const teams = useMemo(() => {
    return [
      ...new Set(triviaData.preguntas.map((question) => question.equipo)),
    ].sort();
  }, []);

  // Filtrar preguntas por equipo
  const questions = useMemo(() => {
    return triviaData.preguntas.filter(
      (question) => question.equipo === selectedTeam,
    );
  }, [selectedTeam]);

  const currentQuestion = questions[questionIndex];

  // Contar respuestas correctas del equipo actual
  const score = questions.filter(
    (question) => answers[question.id] === question.respuestaCorrecta,
  ).length;

  const answeredCount = questions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;

  const finished = questions.length > 0 && answeredCount === questions.length;

  function selectTeam(team) {
    setSelectedTeam(team);
    setQuestionIndex(0);
    setAnswers({});
  }

  function selectAnswer(option) {
    if (!currentQuestion) return;

    // Impedir responder dos veces
    if (answers[currentQuestion.id] !== undefined) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: option,
    }));
  }

  function nextQuestion() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((previous) => previous + 1);
    }
  }

  function previousQuestion() {
    if (questionIndex > 0) {
      setQuestionIndex((previous) => previous - 1);
    }
  }

  function resetTrivia() {
    setQuestionIndex(0);
    setAnswers({});
  }

  return (
    <>
      <Breadcrumb>INICIO &gt; TRIVIA GENERAL</Breadcrumb>

      <main
        className="
          flex
          min-h-[calc(100vh-100px)]
          flex-col
          items-center
          justify-center
          gap-6
          bg-linear-to-br
          from-[#02112d]
          to-[#08245b]
          px-5
          py-10
        "
      >
        <div className="w-full max-w-237.5">
          <label htmlFor="team" className="mb-2 block font-bold text-white">
            Selecciona un equipo
          </label>

          <select
            id="team"
            value={selectedTeam}
            onChange={(event) => selectTeam(event.target.value)}
            className="
              w-full
              rounded-xl
              bg-white
              p-3
              text-black
              outline-none
            "
          >
            <option value="">Selecciona un equipo</option>

            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        {currentQuestion ? (
          <TriviaCard
            question={currentQuestion}
            currentQuestion={questionIndex + 1}
            totalQuestions={questions.length}
            score={score}
            selectedOption={answers[currentQuestion.id] ?? null}
            onSelect={selectAnswer}
            onNext={nextQuestion}
            onPrevious={previousQuestion}
            onReset={resetTrivia}
            hasPrevious={questionIndex > 0}
            hasNext={questionIndex < questions.length - 1}
            finished={finished}
          />
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center">
            <h2 className="text-2xl font-bold text-black">
              Bienvenido a la trivia
            </h2>
            <p className="mt-4 text-gray-600">
              Selecciona un equipo para comenzar.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

//#region TriviaCard

export function TriviaCard({
  question,
  currentQuestion,
  totalQuestions,
  score,
  selectedOption,
  onSelect,
  onNext,
  onPrevious,
  onReset,
  hasPrevious,
  hasNext,
  finished,
}) {
  const answered = selectedOption !== null;

  const isCorrect = selectedOption === question.respuestaCorrecta;

  return (
    <section
      className="
        relative
        w-full
        max-w-237.5
        overflow-hidden
        rounded-[28px]
        bg-white
        px-5
        py-10
        shadow-2xl
        sm:px-12.5
        sm:py-15
      "
    >
      <DecorativeCircles />

      <div className="relative z-10 text-center">
        <div className="mb-6 flex flex-wrap justify-between gap-3">
          <span className="font-bold text-black">
            Pregunta {currentQuestion}/{totalQuestions}
          </span>

          <span className="font-bold text-[#ff2a4b]">
            Puntuación: {score}/{totalQuestions}
          </span>
        </div>

        <h2 className="mb-5 text-xl font-bold text-black">{question.equipo}</h2>

        <p
          className="
            mx-auto
            mb-10
            max-w-200
            text-[22px]
            font-bold
            leading-[1.4]
            text-black
          "
        >
          {question.pregunta}
        </p>

        <div
          className="
            flex
            flex-wrap
            items-center
            justify-center
            gap-5
            sm:gap-10
          "
        >
          {question.opciones.map((option, index) => (
            <TriviaOption
              key={index}
              option={{
                id: String.fromCharCode(65 + index),
                text: option,
              }}
              selected={selectedOption === option}
              correct={option === question.respuestaCorrecta}
              answered={answered}
              onSelect={() => onSelect(option)}
            />
          ))}
        </div>

        {answered && (
          <div className="mt-8">
            {isCorrect ? (
              <p role="status" className="text-lg font-bold text-green-600">
                ¡Respuesta correcta! +1 punto
              </p>
            ) : (
              <div role="status">
                <p className="text-lg font-bold text-red-600">
                  Respuesta incorrecta
                </p>

                <p className="mt-2 font-semibold text-black">
                  La respuesta correcta es:
                </p>

                <p className="font-bold text-green-600">
                  {question.respuestaCorrecta}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="
              rounded-full
              bg-gray-200
              px-6
              py-3
              font-bold
              text-black
              transition
              hover:bg-gray-300
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            Anterior
          </button>

          {hasNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={!answered}
              className="
                rounded-full
                bg-[#ff2a4b]
                px-6
                py-3
                font-bold
                text-white
                transition
                hover:bg-[#dc1737]
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Siguiente
            </button>
          )}
        </div>

        {finished && (
          <div className="mt-10 border-t border-gray-200 pt-8">
            <h3 className="text-2xl font-bold text-black">
              ¡Trivia completada!
            </h3>

            <p className="mt-3 text-xl text-black">
              Obtuviste {score} de {totalQuestions} puntos.
            </p>

            <button
              type="button"
              onClick={onReset}
              className="
                mt-6
                rounded-full
                bg-[#02112d]
                px-8
                py-3
                font-bold
                text-white
                hover:bg-[#08245b]
              "
            >
              Volver a intentar
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

//#endregion

//#region TriviaOption

export function TriviaOption({
  option,
  selected,
  correct,
  answered,
  onSelect,
}) {
  let style = "bg-transparent text-black hover:bg-gray-100";

  if (answered) {
    if (correct) {
      style = "bg-green-600 text-white";
    } else if (selected) {
      style = "bg-red-600 text-white";
    } else {
      style = "bg-transparent text-black";
    }
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={answered}
      className={`
        rounded-full
        px-6
        py-2.5
        text-[22px]
        font-bold
        transition-all
        duration-200
        ${style}
        ${answered ? "cursor-default" : ""}
      `}
    >
      {option.id}) {option.text}
    </button>
  );
}

//#endregion

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
