'use strict';

var Datepicker = (function(doc) {

  var DATE_COUNTS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 记录每月常规天数
  var DATES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]; // 一月最大天数，用来作为截取所需日期的原型
  var PAGE_SIZE = 42;    // 单页显示的所有日期数，因为单月日期最多占据6行，所以6 * 7 = 42

  var curFirstDate = null; // 记录当前月份的第一天，方便访问和计算
  var pickerElem, titleElem, btnPrevElem, btnNextElem, tbodyElem;
  var toggleElem;

  /** 日期选择器HTML模板（未压缩版）
    <div class="m-datepicker">
      <div class="g-hd">
        <div class="g-l">
          <button>&lt;</button>
        </div>
        <div class="g-r">
          <button>&gt;</button>
        </div>
        <div class="g-m">
          <h1 class="u-title"></h1>
        </div>
      </div>
      <div class="g-bd">
        <table>
          <thead>
            <tr>
              <td>日</td>
              <td>一</td>
              <td>二</td>
              <td>三</td>
              <td>四</td>
              <td>五</td>
              <td>六</td>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
   */
  var template = '<div class="m-datepicker"><div class="g-hd"><div class="g-l"><button>&lt;</button></div><div class="g-r"><button>&gt;</button></div><div class="g-m"><h1 class="u-title"></h1></div></div><div class="g-bd"><table><thead><tr><td>日</td><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td>六</td></tr></thead><tbody></tbody></table></div></div>'

  /**
   * [html2Node 将HTML代码转化为DOM]
   * @Author   zzj
   * @DateTime 2018-02-10
   * @version  [0.1]
   * @param    {[string]}   htmlStr   [HTML字符串]
   * @return   {[element]}           [要生成的DOM对象]
   *
   * TODO 目前使用firstChild，也就是说字符串必须从element节点开始，若在最前面的是文本节点则会报错，由于是在组件内部所以不需要考虑这种情况
   */
  function html2Node(htmlStr){
    var temp = doc.createElement('div');
    temp.innerHTML = htmlStr;
    return temp.firstChild;
  }

  function hasClass(elem, clazz){
    if(!elem) return;
    var curClass = elem.className || '';
    return ( (' ' + curClass + ' ').indexOf(' ' + clazz + ' ') !== -1 );  // 前后加空格是为了避免class="helloworld"匹配到了"hello",也认为样式已存在
  }

  function addClass(elem, clazz, noThisClass){
    if(noThisClass || !hasClass(elem, clazz)){   // 本来没有该样式才添加
      var curClass = elem.className.trim();
      elem.className = curClass ? (curClass + ' ' + clazz) : clazz;
    }else{
      return false;
    }
  }

  function delClass(elem, clazz, hasThisClass){
    if(hasThisClass || isHasChasClass(elem, clazz)){
      elem.className = (' ' + elem.className + ' ').replace(' ' + clazz + ' ',' ').trim();
    }else{
      return false;
    }
  }

  function toggleClass(elem, clazz){
    return hasClass(elem, clazz) ? delClass(elem, clazz, true) : addClass(elem, clazz, true);
  }

  /**
   * [Datepicker 构造函数]
   * @Author   zzj
   * @DateTime 2018-02-08
   * @version  [0.1]
   * @param    {[type]}   element [要变成日期选择器的DOM]
   */
  function Datepicker(_toggleElem_){
    if(!_toggleElem_) return;
    toggleElem = _toggleElem_;
    bindEvent(toggleElem);
  }

  /**
   * [isLeapYear 判断是否闰年]
   * @Author   zzj
   * @DateTime 2018-02-07
   * @version  [0.1]
   * @param    {[number]}   year   [要判断的年份]
   * @return   {[Boolean]}         [是否闰年]
   */
  function isLeapYear(year) {
    return year % 400 === 0 || year % 4 == 0 && year % 100 !== 0;
  }

  /**
   * [getFirstWeekDayOfMonth 获取当月第一天是星期几，确定要往前面补多少位]
   * @Author   zzj
   * @DateTime 2018-02-07
   * @version  [0.1]
   * @param    {[number]}   year  [年份]
   * @param    {[number]}   month [月份]
   * @return   {[number]}         [星期几]
   */
  function getFirstDateOfMonth(year, month) {
    var firstDay = new Date(year, month, 1);
    return firstDay;
  }

  /**
   * [getDateCountOfMonth 获取某年某一个月份的日期数组]
   * @Author   zzj
   * @DateTime 2018-02-07
   * @version  [0.1]
   * @param    {[number]}   year  [年份]
   * @param    {[number]}   month [月份]
   * @return   {[array]}          [日期数组]
   */
  function getDatesOfMonth(year, month) {
    var dateCount = DATE_COUNTS[month];
    if (month === 1) { // 如果要获取2月份天数，需要先判断是否闰年，是闰年则加1
      isLeapYear(year) ? (dateCount += 1) : dateCount;
    }
    return DATES.slice(0, dateCount);
  }

  /**
   * [getPaddingBefore 获取显示在当前月份日期之前的日期数组]
   * @Author   zzj
   * @DateTime 2018-02-07
   * @version  [0.1]
   * @param    {[Number]}   year  [年份]
   * @param    {[Number]}   month [月份]
   * @return   {[Array]}          [日期数组]
   */
  function getPaddingBefore(year, month) {
    var firstDay = curFirstDate.getDay();
    var paddingLen = firstDay > 0 ? firstDay : 7;
    var lastMonth = !month ? 12 : (month - 1);
    var dateCount = DATE_COUNTS[lastMonth];
    // if (lastMonth === 1) { // 如果要获取2月份天数，需要先判断是否闰年，是闰年则加1
    //   isLeapYear(year) ? (dateCount += 1) : dateCount;
    // }
    var datesOfLastMonth = DATES.slice(0, dateCount); // TODO 还没考虑边界问题
    return datesOfLastMonth.slice(-(paddingLen));
  }

  /**
   * [getPaddingAfter 获取显示在当前月份日期之后的日期数组]
   * @Author   zzj
   * @DateTime 2018-02-07
   * @version  [0.1]
   * @param    {[Number]}   dateCountBefore [前面已经计算得出的日期数组长度]
   * @return   {[Array]}                   [日期数组]
   */
  function getPaddingAfter(dateCountBefore) {
    return DATES.slice(0, PAGE_SIZE - dateCountBefore);
  }

  /**
   * [createDateArr 创建所需月份的日期数组]
   * @Author   zzj
   * @DateTime 2018-02-07
   * @version  [0.1]
   * @param    {[Date]}   date [可选，初始化日期]
   * @return   {[type]}        [拼接后的日期数组]
   */
  function createDateArr(date) {
    var curYear, curMonth;
    if (curFirstDate) {
      curYear = curFirstDate.getFullYear();
      curMonth = curFirstDate.getMonth();
    } else {
      date || (date = new Date());
      curYear = date.getFullYear(),
        curMonth = date.getMonth();
      curFirstDate = getFirstDateOfMonth(curYear, curMonth);
    }
    var curPaddingBefore = getPaddingBefore(curYear, curMonth);
    var curMonthDates = getDatesOfMonth(curYear, curMonth);
    var curPaddingAfter = getPaddingAfter(curPaddingBefore.length + curMonthDates.length);

    // return curPaddingBefore.concat(curMonthDates).concat(curPaddingAfter);
    return {
      lenBefore: curPaddingBefore.length,
      dateArr: curPaddingBefore.concat(curMonthDates).concat(curPaddingAfter),
      lenAfter: curPaddingAfter.length,
    };
  };

  function render(calcResult) {
    var html = '',
      dateArr = calcResult.dateArr,
      len = dateArr.length,
      lenBeforeNextMonth = PAGE_SIZE - calcResult.lenAfter - 1,
      lenBeforeCurMonth = calcResult.lenBefore,
      CLASS_STRING = ' class="s-gray"',
      classStr = '',
      i;
    for( i=0; i<len; i++ ){
      // 如果不是当月日期，则加上灰色样式类
      classStr =  (i>=lenBeforeCurMonth && i<=lenBeforeNextMonth) ? '' : CLASS_STRING;
      // 如果 i % 7 == 0,则为行内第一个元素，加上<tr>
      // 如果 i % 7 == 6,则为行内最后一个元素，加上</tr>
      if(i%7==0){
        html += '<tr><td' + classStr + '>' + dateArr[i] + '</td>';
      }else if(i%7==6){
        html += '<td' + classStr + '>' + dateArr[i] + '</td></tr>';
      }else{
        html += '<td' + classStr + '>' + dateArr[i] + '</td>';
      }
    }
    tbodyElem.innerHTML = html;    // 插入实际文档
  }

  function toggle(offset) {
    var curMonth = curFirstDate.getMonth();
    curFirstDate.setMonth(curMonth + offset);
    render(createDateArr());
    setTitle(curFirstDate);
  }

  function prev(){
    toggle(-1);
  }

  function next(){
    toggle(1);
  }

  /**
   * [init 初始化相关配置]
   * @Author   zzj
   * @DateTime 2018-02-08
   * @version  [0.1]
   *
   * 注意，有先后顺序的依赖
   */
  function init(){
    initDom();
    initEvent();
    // render(createDateArr());
    // setTitle(curFirstDate);
  }

  function initDom(){

    pickerElem = html2Node(template); // 初始化时，插入模版到文档中
    doc.body.appendChild(pickerElem);

    var headerDom = pickerElem.children[0];
    btnPrevElem = headerDom.children[0];
    btnNextElem = headerDom.children[1];
    titleElem = headerDom.children[2].firstChild;
    tbodyElem = pickerElem.getElementsByTagName('tbody')[0];
  }

  function bindEvent(toggleElem){
    toggleElem.addEventListener('click', show, false);
  }

  function initEvent(){
    btnPrevElem.addEventListener('click', prev, false);
    btnNextElem.addEventListener('click', next, false);
  }

  function setTitle(date){
    titleElem.innerHTML = date.getFullYear() + '年' + (date.getMonth()+1) + '月';
  }

  function show(){
    render(createDateArr());
    setTitle(curFirstDate);
    toggleClass(pickerElem, 'z-show');
  }

  init();   // 第一次加载的时候，生成DOM，以后重用

  return Datepicker;
})(document);