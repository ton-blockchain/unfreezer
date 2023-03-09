import ReactGA from "react-ga4";
const init = () => {
  ReactGA.initialize("G-K4HRF7DW9X");
  ReactGA.send(window.location.pathname);
};

export const analytics = {
  init,
};
