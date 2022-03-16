export default (id: string | undefined): string | undefined =>
  id === '' ? undefined : id;
