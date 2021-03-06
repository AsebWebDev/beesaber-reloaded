const createLocalImageUrl = (fileName: string): string => {
  const baseUrl = process.env.PUBLIC_URL ?? '/public';

  return `${baseUrl}/imgs/${fileName}`;
};

export default createLocalImageUrl;
