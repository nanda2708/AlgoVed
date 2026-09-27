export const VERDICTS = Object.freeze({
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT: 'Time Limit Exceeded',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILATION_ERROR: 'Compilation Error',
  // Judge unavailable or crashed; not the user's fault.
  JUDGE_ERROR: 'Judge Error',
});

// 'Error' is kept so submissions stored before the judge rewrite still validate.
export const VERDICT_VALUES = [...Object.values(VERDICTS), 'Error'];
