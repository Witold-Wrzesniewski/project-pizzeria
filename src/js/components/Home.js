import {templates} from '../settings.js';

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
    
  }
}

export default Home;