var appState = {
  temperature: 'farenheit',
  page: 'home',
  city: null
};
var dataStore = {};

//  AJAX Request to Yahoo weather API.
function weatherYql(location){
  var api = "https://query.yahooapis.com/v1/public/yql?format=json&q="
  var yql = "select * from weather.forecast where woeid in (select woeid from geo.places(1) where text=\"nome, ak\")";
  var rpl = yql.replace("nome, ak", location);
  return api + rpl;
};

// cities row template showing the daily weather conditions 
function rowTemplate(locationData){
  return [
    '<tr>',
      '<td><img src="http://l.yimg.com/a/i/us/we/52/' + locationData.code + '.gif" class="picture"/></td>',
      '<td><a href="#">' + locationData.city +'</a></td>',
      '<td>' + locationData.description + '</td>',
      '<td>' + temperatureDisplayTemplate(locationData.temperature) + '</td>',
      '<td><button class="delete">Delete</button></td>',
    '</tr>'
  ].join('');
};

// Builds home page tempalte with all cities included 
function homeTemplate(locationData){
  appState.page = 'home';
  // locationData here correspond to the dataStore containing all cities ever loaded.
  // The tmpl variable holds an array with *part* of the home page template
  var tmpl = [
    '<header><h1>Weather Forecast</h1></header>',
    temperatureSwitchTemplate(),
    '<form>',
      '<input type="text" placeholder="Add A City"/>',
      '<button type="submit">Submit</button>',
    '</form>',
    '<table id="cities">'
  ];

  // We need to add the previously loaded cities to that incomplete template:
  // So we loop through each city in the location data
  for ( var city in locationData ) {
    // Get the city object inside the location data
    var cityObj = locationData[city];
    // Call the rowTemplate function with that city to get the row of the table
    var rowTmpl = rowTemplate(cityObj);
    // Add that row to the array with the other template strings
    tmpl.push(rowTmpl);
    // Continue the proces until all cities are in the table.
  }

  // Then we add the closing tag of the table to the array
  tmpl.push('</table>');

  // And return the array joined (with no spaces) into a single string.
  return tmpl.join('');
};

function temperatureSwitchTemplate(){
  var celsius =  appState.temperature === 'celsius' ? 'checked' : '';
  var farenheit = appState.temperature === 'farenheit' ? 'checked' : '';

  return [
    'Temperature:',
    '<input type="radio" name="temp" value="celsius"', celsius,'/> Celsius',
    '<input type="radio" name="temp" value="farenheit"', farenheit,'/> Farenheit'
  ].join(' ');
};

function temperatureDisplayTemplate(temperature){
  if ( appState.temperature === 'farenheit' ) {
    return temperature + 'ºF';
  }
  
  var farenheit = Number(temperature);
  var formula = Math.round((farenheit  -  32)  *  5/9);
  return formula + 'ºC';
};

// specific city 5 day forecast template 
// Object {code: "28", description: "Mostly Cloudy", temperature: "56", date: "11 Feb 2015", city: "San Francisco"…}
function forecastTemplate(locationData){
  appState.page = 'forecast';
  appState.city = locationData.city;
  var tmpl = [
    '<h1>Detailed Forecast</h1>',
    '<button class="back">Back</button>',
    temperatureSwitchTemplate(),
    '<h2>' + locationData.city + '</h2>',
    '<table>',
    '<tr>',
  ];

  for (var i = 0; i < locationData.forecast.length; i++) {
    var forecast = locationData.forecast[i];
    var forecastTmpl = forecastRowTemplate(forecast);
    tmpl.push(forecastTmpl);
  }

  tmpl.push('</tr></table>');
  return tmpl.join(' ');
};

function forecastRowTemplate(forecastData){
  // Object {code: "28", description: "Mostly Cloudy", temperature: "56", date: "11 Feb 2015", city: "San Francisco"…}
  return [
      '<td>',
        forecastData.day, '<br/>',
        forecastData.date, '<br/>',
        '<img src="http://l.yimg.com/a/i/us/we/52/' + forecastData.code + '.gif" class="picture"/>', '<br/>',
        forecastData.text, '<br/>',

        'High ', temperatureDisplayTemplate(forecastData.high), '<br/>',
        'Low ', temperatureDisplayTemplate(forecastData.low),
      '</td>'
  ].join('');  
};

// using JSON formatted response retrieved from Yahoo Weather API.
function handleResponse(response){
  var channel = response.query.results.channel;
  var row = {
    code: channel.item.condition.code,
    description: channel.item.condition.text,
    temperature: channel.item.condition.temp,
    date: channel.item.forecast[0].date,
    city: channel.location.city,
    unit: channel.units.temperature,
    forecast: channel.item.forecast
  };

  // storage for objects key by city
  dataStore[row.city] = row;

  // show homepage
  $('body').html( homeTemplate(dataStore) );
};

$(document)
  // add a city to the list
  .on('submit', 'form', function(){
    var location = $(this).find('input').prop('value');
  
    // validate input for city name
    if ( /^[a-zA-Z\s,-]+$/i.test(location) ) {
      $.getJSON(weatherYql(location), handleResponse);
    }
    else {
      alert(location + ' is not a valid city name');
    }

    return false;
  })
  // change state of the app 
  .on('change', 'input[name="temp"]', function(){
    appState.temperature = $(this).val();
    var pageFunction = window[appState.page + 'Template'];
    var pageData = appState.page === 'forecast' ? dataStore[appState.city] : dataStore; 
    $('body').html( pageFunction(pageData) );
  })
  // delete a city from the list
  .on('click', '.delete', function(){
    var tableRow = $(this).parents('tr');
    tableRow.remove();
  })
  // show specific city detailed 5 day forecast 
  .on('click', '#cities a', function(){
    var cityName = $(this).text();
    var specificCity = forecastTemplate(dataStore[cityName]);
    $('body').html(specificCity);
  })
  // show list of all cities
  .on('click', '.back', function(){
    $('body').html( homeTemplate(dataStore) );
  });

// Kick off:
// city already available with current weather
$.getJSON(weatherYql("san francisco, ca"), handleResponse);
