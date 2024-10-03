export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'addHighScore' : IDL.Func([IDL.Text, IDL.Int], [], []),
    'getHighScores' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Int))],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
