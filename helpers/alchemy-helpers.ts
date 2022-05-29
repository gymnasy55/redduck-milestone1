export const getAlchemyUrl = (prefix: string, alchemyKey: string): string =>
  `https://${prefix}.alchemyapi.io/v2/${alchemyKey}`;

export const getGoerliAlchemyUrl = (alchemyKey: string) =>
  getAlchemyUrl('eth-goerli', alchemyKey);
