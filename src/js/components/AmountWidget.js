import {settings, select} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget{
  constructor(element){
    super(element, settings.amountWidget.defaultValue);
    const thisWidget = this;
    thisWidget.getElements();
    thisWidget.setValue(thisWidget.dom.input.value ? thisWidget.dom.input.value : settings.amountWidget.defaultValue);
    thisWidget.initActions();
    //console.log('AmountWidget: ', thisWidget);
  }

  getElements(){
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }

  isValid(value){
    return !isNaN(value)
    && value >= settings.amountWidget.defaultMin
    && value <= settings.amountWidget.defaultMax;
  }

  renderValue(){
    const thisWidget = this;
    thisWidget.dom.input.value = thisWidget.value;
    //console.log(thisWidget.value);
  }

  initActions(){
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function(){
      thisWidget.setValue(parseInt(thisWidget.dom.input.value));
    });
    thisWidget.dom.linkDecrease.addEventListener('click', function(){
      thisWidget.setValue(parseInt(thisWidget.dom.input.value) - 1);
    });
    thisWidget.dom.linkIncrease.addEventListener('click', function(){
      thisWidget.setValue(parseInt(thisWidget.dom.input.value) + 1);
    });
  }
}

export default AmountWidget;