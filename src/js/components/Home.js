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
    thisHome.dom.navLinks = document.querySelectorAll(select.nav.links);
    thisHome.dom.buttons = document.querySelectorAll(select.homePage.buttons);
    thisHome.dom.carousel = select.homePage.carousel;

    const flkty = new Flickity(thisHome.dom.carousel, {
      wrapAround: true,
      autoPlay: 3000,
      prevNextButtons: false,
      contain: true
    });
    thisHome.initButtons();
  }
  initButtons(){
    const thisHome = this;
    for(const button of thisHome.dom.buttons){
      button.addEventListener('click', function(event){
        for(const link of thisHome.dom.navLinks){
          const id = link.getAttribute('href').replace('#', '');
          if(id === button.id)
            link.dispatchEvent(new Event('click'));
        }
      });
    }
  }
}

export default Home;