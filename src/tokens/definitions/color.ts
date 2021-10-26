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

const createGlow = (color: ColorSet): string => `
  color: ${color.light};
  -webkit-transition: color 0.6s ease-out, text-shadow 0.6s ease-out;
  -moz-transition: color 0.6s ease-out, text-shadow 0.6s ease-out;
  -o-transition: color 0.6s ease-out, text-shadow 0.6s ease-out;
  transition: color 0.6s ease-out, text-shadow 0.6s ease-out;
  text-shadow: ${color.main} -2px -1px 5px, ${color.main} 2px 1px 5px,
    ${color.main} 0px 0px 10px, ${color.main} 0px 0px 15px, ${color.main} 0px 0px 20px,
    ${color.main} 0px 0px 30px;
`;
const allColorSetsArray = [blue, red, yellow];

export { allColorSetsArray };

export type { ColorSet, PageSet };

export default {
  blue,
  createGlow,
  page,
  red,
  yellow,
};
