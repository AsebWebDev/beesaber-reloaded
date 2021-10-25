import futura from './futura';
import helvetica from './helvetica';

const futuraBook = futura.book;
const futuraDemi = futura.demi;

const definitions = {
  display: {
    ...futuraDemi,
    fontSize: '4rem',
    lineHeight: '1.05',
  },
  headline1: {
    ...futuraDemi,
    fontSize: '2.5rem',
    lineHeight: '1.2',
  },
  headline2: {
    ...futuraDemi,
    fontSize: '1.75rem',
    lineHeight: '1.15',
  },
  headline3: {
    ...futuraDemi,
    fontSize: '1.375rem',
    lineHeight: '1.1',
  },
  headline4: {
    ...futuraDemi,
    fontSize: '1.125rem',
    lineHeight: '1.35',
  },
  info: {
    regular: {
      ...futuraBook,
      fontSize: '0.8125rem',
      lineHeight: '1.25',
    },
    strong: {
      ...futuraDemi,
      fontSize: '0.8125rem',
      lineHeight: '1.25',
    },
  },
  base: {
    regular: {
      fontFamily: helvetica,
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.25',
    },
    strong: {
      fontFamily: helvetica,
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: '1.25',
    },
  },
  body: {
    regular: {
      fontFamily: helvetica,
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: '1.5',
    },
    strong: {
      fontFamily: helvetica,
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: '1.5',
    },
  },
} as const;

export default definitions;
