type PrefixActionType = <Prefix extends string>(
    prefix: Prefix
  ) => <ActionType extends string>(
    actionType: ActionType
  ) => `${Prefix}/${ActionType}`;
  
  const prefixActionType: PrefixActionType = (prefix) => (actionType) =>
    `${prefix}/${actionType}` as const;
  
  export default prefixActionType;
