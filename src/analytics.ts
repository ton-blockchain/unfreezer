import ReactGA from "react-ga4";
const init = () => {
  ReactGA.initialize("G-PJLJSLZZ7J");
  ReactGA.send(window.location.pathname);
};

export const analytics = {
  init,
};
