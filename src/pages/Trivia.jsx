import { Breadcrumb } from "../globals.jsx";
import { useEffect, useMemo, useState } from "react";
import triviaData from "../json/trivia_opciones.json";

// Cada navegador guarda sus propios datos en localStorage.
const STORAGE_KEY = "trivia_general_progreso_v1";
const EMPTY_DATA = { selectedTeam: "", progress: {}, records: {} };

function loadSavedData() {
  if (typeof window === "undefined") return EMPTY_DATA;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;

    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return EMPTY_DATA;

    return {
      selectedTeam:
        typeof saved.selectedTeam === "string" ? saved.selectedTeam : "",
      progress:
        saved.progress &&
        typeof saved.progress === "object" &&
        !Array.isArray(saved.progress)
          ? saved.progress
          : {},
      records:
        saved.records &&
        typeof saved.records === "object" &&
        !Array.isArray(saved.records)
          ? saved.records
          : {},
    };
  } catch (error) {
    console.warn("No se pudo recuperar el progreso de la trivia:", error);
    return EMPTY_DATA;
  }
}

// Solo cuentan las respuestas de preguntas que existen en la versión actual del JSON.
function getTeamProgress(teamQuestions, savedProgress) {
  const answers =
    savedProgress?.answers && typeof savedProgress.answers === "object"
      ? savedProgress.answers
      : {};

  const answeredCount = teamQuestions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;

  const score = teamQuestions.filter(
    (question) => answers[question.id] === question.respuestaCorrecta,
  ).length;

  return { answers, answeredCount, score };
}

export default function Trivia() {
  const [savedData, setSavedData] = useState(loadSavedData);

  // Guardar automáticamente cada respuesta y cambio de pregunta/equipo.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    } catch (error) {
      console.warn("No se pudo guardar la trivia en este navegador:", error);
    }
  }, [savedData]);

  const teams = useMemo(
    () =>
      [
        ...new Set(triviaData.preguntas.map((question) => question.equipo)),
      ].sort(),
    [],
  );

  const selectedTeam = teams.includes(savedData.selectedTeam)
    ? savedData.selectedTeam
    : "";

  const questions = useMemo(
    () =>
      triviaData.preguntas.filter(
        (question) => question.equipo === selectedTeam,
      ),
    [selectedTeam],
  );

  const savedProgress = savedData.progress[selectedTeam];
  const { answers, answeredCount, score } = getTeamProgress(
    questions,
    savedProgress,
  );

  // Si se modificó el JSON, evitamos índices fuera de rango.
  const questionIndex = Math.min(
    Math.max(
      Number.isInteger(savedProgress?.questionIndex)
        ? savedProgress.questionIndex
        : 0,
      0,
    ),
    Math.max(questions.length - 1, 0),
  );

  const currentQuestion = questions[questionIndex];
  const finished = questions.length > 0 && answeredCount === questions.length;
  const record = savedData.records[selectedTeam] ?? null;

  const teamSummaries = useMemo(() => {
    return teams.map((team) => {
      const teamQuestions = triviaData.preguntas.filter(
        (question) => question.equipo === team,
      );
      const stats = getTeamProgress(teamQuestions, savedData.progress[team]);

      return {
        name: team,
        total: teamQuestions.length,
        answered: stats.answeredCount,
        complete:
          teamQuestions.length > 0 &&
          stats.answeredCount === teamQuestions.length,
        record: savedData.records[team] ?? null,
      };
    });
  }, [teams, savedData.progress, savedData.records]);

  const completedTeams = teamSummaries.filter((team) => team.complete).length;

  function selectTeam(team) {
    setSavedData((previous) => ({ ...previous, selectedTeam: team }));
  }

  function selectAnswer(option) {
    if (!currentQuestion) return;

    setSavedData((previous) => {
      const previousProgress = previous.progress[selectedTeam] ?? {};
      const previousAnswers = previousProgress.answers ?? {};

      // Evitar que una pregunta se responda dos veces.
      if (previousAnswers[currentQuestion.id] !== undefined) return previous;

      const nextAnswers = {
        ...previousAnswers,
        [currentQuestion.id]: option,
      };
      const nextStats = getTeamProgress(questions, { answers: nextAnswers });
      const justFinished = nextStats.answeredCount === questions.length;
      const previousRecord = previous.records[selectedTeam];

      // El récord se actualiza únicamente al terminar una trivia.
      const improvedRecord =
        justFinished &&
        (!previousRecord || nextStats.score > previousRecord.score);

      return {
        ...previous,
        progress: {
          ...previous.progress,
          [selectedTeam]: {
            questionIndex,
            answers: nextAnswers,
          },
        },
        records: improvedRecord
          ? {
              ...previous.records,
              [selectedTeam]: {
                score: nextStats.score,
                total: questions.length,
              },
            }
          : previous.records,
      };
    });
  }

  function moveQuestion(index) {
    if (!selectedTeam || index < 0 || index >= questions.length) return;

    setSavedData((previous) => ({
      ...previous,
      progress: {
        ...previous.progress,
        [selectedTeam]: {
          ...previous.progress[selectedTeam],
          questionIndex: index,
          answers: previous.progress[selectedTeam]?.answers ?? {},
        },
      },
    }));
  }

  function resetTeam(askConfirmation = false) {
    if (!selectedTeam) return;

    if (
      askConfirmation &&
      !window.confirm(
        `¿Reiniciar la trivia de ${selectedTeam}? Se borrarán sus respuestas, pero conservarás el récord.`,
      )
    ) {
      return;
    }

    setSavedData((previous) => {
      const nextProgress = { ...previous.progress };
      delete nextProgress[selectedTeam];
      return { ...previous, progress: nextProgress };
    });
  }

  function resetAllTests() {
    if (
      !window.confirm(
        "¿Quieres volver a empezar TODOS los tests? Se borrarán las respuestas y el avance de todos los equipos. Tus récords se conservarán.",
      )
    ) {
      return;
    }

    setSavedData((previous) => ({ ...previous, progress: {} }));
  }

  function clearEverything() {
    if (
      !window.confirm(
        "¿Eliminar TODO el progreso y TODOS los récords guardados en este navegador? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    setSavedData({ selectedTeam: "", progress: {}, records: {} });
  }

  return (
    <>
      <Breadcrumb>INICIO &gt; TRIVIA GENERAL</Breadcrumb>

      <main
        className="
          flex min-h-[calc(100vh-100px)] flex-col items-center
          justify-center gap-6 bg-linear-to-br from-[#02112d]
          to-[#08245b] px-4 py-8 sm:px-5 sm:py-10
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
            className="w-full rounded-xl bg-white p-3 text-black outline-none"
          >
            <option value="">Selecciona un equipo</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          <p className="mt-2 text-sm text-white/70">
            Tu avance y tus récords se guardan automáticamente en este
            navegador.
          </p>
        </div>

        {currentQuestion ? (
          <TriviaCard
            question={currentQuestion}
            currentQuestion={questionIndex + 1}
            totalQuestions={questions.length}
            score={score}
            record={record}
            answeredCount={answeredCount}
            selectedOption={answers[currentQuestion.id] ?? null}
            onSelect={selectAnswer}
            onNext={() => moveQuestion(questionIndex + 1)}
            onPrevious={() => moveQuestion(questionIndex - 1)}
            onReset={() => resetTeam(false)}
            hasPrevious={questionIndex > 0}
            hasNext={questionIndex < questions.length - 1}
            finished={finished}
          />
        ) : (
          <div className="w-full max-w-237.5 rounded-2xl bg-white p-6 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-black">
              Bienvenido a la trivia
            </h2>
            <p className="mt-4 text-gray-600">
              Selecciona un equipo para comenzar.
            </p>
          </div>
        )}

        {/* Acciones para volver a hacer una o todas las trivias */}
        <div className="flex w-full max-w-237.5 flex-col gap-3 sm:flex-row sm:flex-wrap">
          {selectedTeam && (
            <button
              type="button"
              onClick={() => resetTeam(true)}
              className="w-full rounded-full border border-white/40 px-5 py-2.5 font-bold text-white transition hover:bg-white/10 sm:w-auto"
            >
              Reiniciar este equipo
            </button>
          )}

          <button
            type="button"
            onClick={resetAllTests}
            className="w-full rounded-full bg-[#ff2a4b] px-5 py-2.5 font-bold text-white transition hover:bg-[#dc1737] sm:w-auto"
          >
            Reiniciar todos los tests
          </button>

          <button
            type="button"
            onClick={clearEverything}
            className="w-full rounded-full border border-red-300/50 px-5 py-2.5 font-bold text-red-200 transition hover:bg-red-500/20 sm:w-auto"
          >
            Borrar progreso y récords
          </button>
        </div>

        {/* Resumen guardado por equipo */}
        <section className="w-full max-w-237.5 rounded-2xl border border-white/10 bg-white/5 p-5 text-white sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-black uppercase">Mi progreso</h2>
            <span className="font-bold text-[#ff6b83]">
              Tests completados: {completedTeams}/{teams.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {teamSummaries.map((team) => (
              <button
                key={team.name}
                type="button"
                onClick={() => selectTeam(team.name)}
                className={`rounded-xl border p-4 text-left transition hover:bg-white/10 ${
                  selectedTeam === team.name
                    ? "border-[#ff2a4b] bg-white/10"
                    : "border-white/15"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-bold">{team.name}</span>
                  <span className="text-xs text-white/70">
                    {team.complete
                      ? "Completado"
                      : `${team.answered}/${team.total}`}
                  </span>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-white/15"
                  role="progressbar"
                  aria-label={`Progreso de ${team.name}`}
                  aria-valuemin={0}
                  aria-valuemax={team.total}
                  aria-valuenow={team.answered}
                >
                  <div
                    className="h-full rounded-full bg-[#ff2a4b]"
                    style={{
                      width: `${team.total ? (team.answered / team.total) * 100 : 0}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-sm text-white/75">
                  Récord:{" "}
                  {team.record
                    ? `${team.record.score}/${team.record.total}`
                    : "Sin récord"}
                </p>
              </button>
            ))}
          </div>
        </section>
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
  record,
  answeredCount,
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
        px-4
        py-8
        shadow-2xl
        sm:px-8
        sm:py-12
        lg:px-12.5
        lg:py-15
      "
    >
      <DecorativeCircles />

      <div className="relative z-10 text-center">
        <div className="mb-6 flex flex-wrap justify-center gap-3 text-sm sm:justify-between sm:text-base">
          <span className="font-bold text-black">
            Pregunta {currentQuestion}/{totalQuestions}
          </span>

          <span className="font-bold text-[#ff2a4b]">
            Puntuación: {score}/{totalQuestions}
          </span>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-center gap-3 text-sm font-bold">
          <span className="rounded-full bg-gray-100 px-4 py-2 text-gray-800">
            Avance: {answeredCount}/{totalQuestions}
          </span>
          <span className="rounded-full bg-amber-100 px-4 py-2 text-amber-800">
            Récord: {record ? `${record.score}/${record.total}` : "Sin récord"}
          </span>
        </div>

        <h2 className="mb-5 text-xl font-bold text-black">{question.equipo}</h2>

        <p
          className="
            mx-auto
            mb-10
            max-w-200
            break-words
            text-lg
            sm:text-[22px]
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
            gap-3
            sm:gap-5
            lg:gap-10
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

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="
              w-full
              rounded-full
              bg-gray-200
              sm:w-auto
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
                w-full
                rounded-full
                bg-[#ff2a4b]
                sm:w-auto
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
        w-full
        max-w-full
        break-words
        rounded-full
        px-4
        py-2.5
        text-base
        sm:w-auto
        sm:px-6
        sm:text-[22px]
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
          h-35
          w-35
          sm:h-55
          sm:w-55
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
          h-35
          w-35
          sm:h-55
          sm:w-55
          rounded-full
          border-18
          border-[#ff2a4b]
        "
      />
    </>
  );
}
