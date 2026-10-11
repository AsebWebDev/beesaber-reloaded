const createLocalImageUrl = (fileName: string): string =>
  `${import.meta.env.BASE_URL}imgs/${fileName}`;

export default createLocalImageUrl;
