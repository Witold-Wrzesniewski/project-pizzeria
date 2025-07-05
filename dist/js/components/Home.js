import {templates, select} from '../settings.js';

class Home {
  constructor(element){
    const thisHome = this;

    thisHome.render(element);
  }
  render(element){
    const thisHome = this;

    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = templates.homePage();

    thisHome.dom.carousel = select.homePage.carousel;
    const flkty = new Flickity(thisHome.dom.carousel, {
      wrapAround: true
    });
  }
}

export default Home;