import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';

const app = {
  initPages: function(){
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);

    const idFromHash = window.location.hash.replace('#/', '');
    let pageMatchingHash = thisApp.pages[0].id;

    for(const page of thisApp.pages){
      if(page.id == idFromHash){
        pageMatchingHash = idFromHash;
        break;
      }
    }

    thisApp.activatePage(pageMatchingHash);
    for(const link of thisApp.navLinks){
      link.addEventListener('click', function(event){
        const clickedElement = this;
        event.preventDefault();

        const id = clickedElement.getAttribute('href').replace('#', '');
        thisApp.activatePage(id);
        /* Change URL hash */
        window.location.hash = '#/' + id;
      });
    }
  },
  activatePage: function(pageId){
    const thisApp = this;

    /* Add class active to matching pages, remove from non matching */
    for (const page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
    /* Add class active to matching links, remove from non matching */
    for (const link of thisApp.navLinks){
      link.classList.toggle(
      classNames.nav.active,
      link.getAttribute('href') == '#' + pageId
    );
    }
  },
  initMenu: function(){
    const thisApp = this;
    for(let productData in thisApp.data.products){
      new Product(productData, thisApp.data.products[productData]);
    }
  },

  initData: function() {
    const thisApp = this;
    /* thisApp.data = dataSource; */
    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.products;

    fetch(url).then(function(rawResponse){
      return rawResponse.json();
    }).then(function(parsedResponse){

      /* save parsedResponse as thisApp.data.products */
      thisApp.data.products = {};
      for(let product of parsedResponse){
        const productId = product.id;
        delete product.id;
        thisApp.data.products[productId] = product;
      }

      /* execute initMenu method */
      thisApp.initMenu();
      //console.log('thisApp.data: ', JSON.stringify(thisApp.data));
    });

    //console.log('thisApp.data: ', JSON.stringify(thisApp.data)); <-- {}
  },

  initCart: function(){
    const thisApp = this;
    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function(event){
      thisApp.cart.add(event.detail.product); // Or app.cart
    });
  },
  init: function(){
    const thisApp = this;

    thisApp.initPages();
    thisApp.initData();
    //thisApp.initMenu();
    thisApp.initCart(thisApp.cartElem);
  },
};

app.init();

