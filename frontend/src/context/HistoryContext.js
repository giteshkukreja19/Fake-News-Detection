import React, { createContext, useContext, useReducer } from "react";

const HistoryContext = createContext();

const SAMPLE = [
  {
    id: 1,
    text: "COVID-19 Cure Found",
    result: { verdict: "FAKE", confidence: 92, explanation: "No confirmed cure exists for COVID-19.", credibility_score: 2, source_reliability: "Low" },
    time: "Apr 20, 2025 · 10:32 AM",
  },
  {
    id: 2,
    text: "Election Results Update — State Officials Certify Outcome",
    result: { verdict: "REAL", confidence: 87, explanation: "Credible reporting from verified official sources.", credibility_score: 8, source_reliability: "High" },
    time: "Apr 21, 2025 · 2:14 PM",
  },
  {
    id: 3,
    text: "Celebrity Hoax Scandal Exposed",
    result: { verdict: "FAKE", confidence: 78, explanation: "Unverified celebrity rumour with no credible sourcing.", credibility_score: 3, source_reliability: "Low" },
    time: "Apr 22, 2025 · 9:05 AM",
  },
  {
    id: 4,
    text: "Tech Breakthrough News — Researchers Confirm Quantum Milestone",
    result: { verdict: "REAL", confidence: 83, explanation: "Published by credible peer-reviewed tech outlets.", credibility_score: 7, source_reliability: "High" },
    time: "Apr 23, 2025 · 4:45 PM",
  },
];

let nextId = 100;

function reducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [{ id: ++nextId, ...action.payload }, ...state];
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function HistoryProvider({ children }) {
  const [history, dispatch] = useReducer(reducer, SAMPLE);

  const addEntry = (text, result) => {
    dispatch({
      type: "ADD",
      payload: {
        text,
        result,
        time: new Date().toLocaleString("en-US", {
          month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit",
        }),
      },
    });
  };

  const clearHistory = () => dispatch({ type: "CLEAR" });

  return (
    <HistoryContext.Provider value={{ history, addEntry, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  return useContext(HistoryContext);
}
