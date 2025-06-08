import {select, classNames, templates} from '../settings.js';
import {utils} from "../utils.js";
import AmountWidget from './AmountWidget.js';

class Product {
  constructor (id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.dom = {};
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }
  renderInMenu(){
    const thisProduct = this;

    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);
    /* create element using utils.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);
    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;

    thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
    thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAmountWidget(){
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);

    thisProduct.dom.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }

  initAccordion(){
    const thisProduct = this;

    /* find clickable trigger */
    /* START: add event listiner to clickable trigger on event 'click' */
    thisProduct.dom.accordionTrigger.addEventListener('click', function(event){
      event.preventDefault();
      /* find active product */
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      /* if active product is not thisProduct.element remove class active */
      if(activeProduct !== thisProduct.element && activeProduct){
        activeProduct.classList.remove('active');
      }
      /* toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle('active');
    });
  }

  initOrderForm(){
    const thisProduct = this;

    thisProduct.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.dom.formInputs){
      input.addEventListener('change', function(event){
        thisProduct.processOrder();
      });
    }

    thisProduct.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }
  
  processOrder(){
    const thisProduct = this;

    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
    //console.log('processOrder: ', thisProduct.dom.form);

    // set price to default price
    let price = thisProduct.data.price;

    // for every param
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];

      // for every option in this param
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }

        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        // check if there is param with a name of paramId in formData and if it includes optionId
        if(optionSelected){
          // check if the option is not default
          if(!thisProduct.data.params[paramId].options[optionId].hasOwnProperty('default') ||
            thisProduct.data.params[paramId].options[optionId].default == false) {
            // add option price to price variable
            price += thisProduct.data.params[paramId].options[optionId].price;
          }
        } else{
          // check if the option is default
          if(thisProduct.data.params[paramId].options[optionId].default) {
            // reduce price variable
            price -= thisProduct.data.params[paramId].options[optionId].price;
          }
        }

        /* find image with class .paramId-optionId in an image-wrapper */
        const image = thisProduct.dom.imageWrapper.querySelector(`.${paramId}-${optionId}`);
        /* check if image exists */
        if(image){
          /* check if patramId.optionId is selected and add class .active */
          if(optionSelected){
            image.classList.add(classNames.menuProduct.imageVisible);
          }
          /* else remove class .active */
          else{
            image.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }

    // update calculated price in the HTML
    thisProduct.priceSingle = price;
    price *= thisProduct.amountWidget.value;
    thisProduct.dom.priceElem.innerHTML = price;
  }

  addToCart(){
    const thisProduct = this;

    //app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct()
      }
    });
    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {};
    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = productSummary.priceSingle * productSummary.amount;

    productSummary.params = thisProduct.prepareCartProductParams();

    return productSummary;
  }

  prepareCartProductParams(){
    const thisProduct = this;

    const params = {};
    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.dom.form);

    // for every param
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      // add param to thisProduct.cartProductParams object

      //params[paramId].label = thisProduct.data.params[paramId].label;
      params[paramId] = {
        label: thisProduct.data.params[paramId].label,
        options: {}
      };

      // for every option in this param
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }

        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        // check if there is param with a name of paramId in formData and if it includes optionId
        if(optionSelected){
            // add option to thisProduct.cartProductParams object
            params[paramId].options[optionId] = thisProduct.data.params[paramId].options[optionId].label;
          }
        } 
    }
    return params;
  }
}

export default Product;