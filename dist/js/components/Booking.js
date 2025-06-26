import {select, templates, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element){
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.selectedTable = 0;
  }
  render(element){
    const thisBooking = this;

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = templates.bookingWidget();
    
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.peopleAmountInput = thisBooking.dom.peopleAmount.querySelector(select.booking.peopleAmountInput);
    thisBooking.dom.hoursAmountInput = thisBooking.dom.hoursAmount.querySelector(select.booking.hoursAmountInput);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.datePickerInput = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisBooking.dom.hourPickerInput = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.input);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

    thisBooking.dom.tablesWrapper = thisBooking.dom.wrapper.querySelector(select.booking.tablesWrapper);
    thisBooking.dom.alert = thisBooking.dom.wrapper.querySelector(select.booking.alert);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.submit = thisBooking.dom.wrapper.querySelector(select.booking.submit);
  }
  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDom();
    });
    /*thisBooking.dom.hoursAmount.addEventListener('updated', function(){
      console.log('Updated hours amount. New amount: ', this.querySelector('input.amount').value);
    });*/
    thisBooking.dom.tablesWrapper.addEventListener('click', function(event){
      const clickedElement = event.target;
      if(clickedElement.classList.contains('table')){
        thisBooking.initTables(clickedElement);        
      }      
    });
    thisBooking.dom.submit.addEventListener('click', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }
  initTables(clickedTable){
    const thisBooking = this;

    if(clickedTable.classList.contains(classNames.booking.tableBooked)){
      thisBooking.dom.alert.classList.remove(classNames.booking.alertHidden);
      thisBooking.selectedTable = 0;
      for(const table of thisBooking.dom.tables){
        table.classList.remove(classNames.booking.tableSelected);
      }
      return;
    }

    thisBooking.dom.alert.classList.add(classNames.booking.alertHidden);
    for(const table of thisBooking.dom.tables){
      if(table !== clickedTable)
        table.classList.remove(classNames.booking.tableSelected);
    }
    thisBooking.selectedTable = parseInt(clickedTable.getAttribute('data-table'));
    clickedTable.classList.toggle(classNames.booking.tableSelected);
  }
  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const params = {
      booking: [
        startDateParam,
        endDateParam
      ],
      eventsCurrent: [
        startDateParam,
        endDateParam,
        settings.db.notRepeatParam
      ],
      eventsRepeat: [
        endDateParam,
        settings.db.repeatParam
      ]
    };
    const urls = {
      booking:       settings.db.url + '/' + settings.db.bookings
       + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events
       + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.events
       + '?' + params.eventsRepeat.join('&')
    };
    //console.log(urls);
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat)
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json()
        ]);
      })
      .then(function([parsedBookings, parsedEventsCurrent, parsedEventsRepeat]){
        //console.log(parsedBookings, parsedEventsCurrent, parsedEventsRepeat);
        thisBooking.parseData(parsedBookings, parsedEventsCurrent, parsedEventsRepeat);
      });
  }
  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(const item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(const item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;
    for(const item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    //console.log(thisBooking.booked);
    thisBooking.updateDom();
  }
  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration ; hourBlock += 0.5){
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }
  updateDom(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(const table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      if(!allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else{
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

    thisBooking.dom.alert.classList.add(classNames.booking.alertHidden);
    for(const table of thisBooking.dom.tables){
      table.classList.remove(classNames.booking.tableSelected);
    }
  }
  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;

    const payload = {};
    payload.date = thisBooking.dom.datePickerInput.value;
    payload.hour = utils.numberToHour(thisBooking.dom.hourPickerInput.value);
    payload.table = thisBooking.selectedTable;
    payload.duration = parseInt(thisBooking.dom.hoursAmountInput.value);
    payload.ppl = parseInt(thisBooking.dom.peopleAmountInput.value);
    payload.starters = [];
    payload.phone = thisBooking.dom.phone.value;
    payload.address = thisBooking.dom.address.value;

    for(let starter of thisBooking.dom.starters) {
      if(starter.checked)
        payload.starters.push(starter.value);
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
    .then(function(response){
      return response.json();
    }).then(function(parsedResponse){
      console.log('parsedResponse: ', parsedResponse);
      thisBooking.makeBooked(parsedResponse.date, parsedResponse.hour, parsedResponse.duration, parsedResponse.table);
      thisBooking.updateDom();
    });

  }
}

export default Booking;