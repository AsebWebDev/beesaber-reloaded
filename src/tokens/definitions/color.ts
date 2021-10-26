type ColorSet = {
  light: string;
  main: string;
  shadow?: string;
};

type PageSet = {
  bgColor: string;
};

const page: PageSet = {
  bgColor: '#00111f',
};

const blue: ColorSet = {
  main: 'blue',
  light: '#edf5ff',
  shadow: '#7979ff',
};

const red: ColorSet = {
  main: '#ff0025',
  light: '#fff0f0',
  shadow: '#ff8d9e',
};

const yellow: ColorSet = {
  main: '#ffeb00',
  light: '#fffcdd',
};

export type { ColorSet, PageSet };

export default {
  blue,
  page,
  red,
  yellow,
};
