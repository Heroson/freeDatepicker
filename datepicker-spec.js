'use strict';

describe('Datepicker', function(){

  beforeEach(function(){
    curFirstDate = null;
  })

  it('determine whether a year is leap year', function(){
    expect(isLeapYear(2018)).toEqual(false);
    expect(isLeapYear(2000)).toEqual(true);
    expect(isLeapYear(1999)).toEqual(false);
    expect(isLeapYear(2020)).toEqual(true);
  });

  it('get the first week day of current month', function(){
    var today = new Date();
    var curYear = today.getFullYear();
    var curMonth = today.getMonth();
    var firstWeekDay = new Date(curYear, curMonth, 1);
    expect(getFirstDateOfMonth(curYear, curMonth).getDay()).toBe(firstWeekDay.getDay());
  });

  it('add one day if current month is February of a leap year', function(){
    expect(getDatesOfMonth(2016, 1).length).toBe(29);
  });


  it('can create prev month date array', function(){

    var testDate = new Date(2018, 1, 7);
    var curMonthDates = createDateArr();
    var prevMonthDates = prev();

    var cur9 = curMonthDates.slice(0, 9);
    var prev9 = prevMonthDates.slice(0, 9);

    expect(prevMonthDates.length).toBe(42);

    expect(cur9[0]).toBe(28);               // 因为最多补7位，所以测试前8个即可
    expect(cur9[cur9.length-1]).toBe(5);
    expect(prev9[0]).toBe(31);
    expect(prev9[prev9.length-1]).toBe(8);
  });

  it('can create next month date array', function(){
    var curMonthDates = createDateArr();
    // console.log(curMonthDates);
    var nextMonthDates = next();
    // console.log(nextMonthDates);

    var next9 = nextMonthDates.slice(0, 9);

    expect(nextMonthDates.length).toBe(42);

    expect(next9[0]).toBe(25);               // 因为最多补7位，所以测试前8个即可
    expect(next9[next9.length-1]).toBe(5);
  });

  it('can deal with the problem when across the years', function(){

  })

})