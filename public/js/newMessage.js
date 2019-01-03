let iceToast = {
  help:{
    version: '1.3.1',
  },
  baseConfig:{
    time: 4000,
    position: 'top-center',
    colors:{
      'dark': 'rgba(50,50,50,0.9)',
      'green': '#22B14C',
      'blue': '#00A2E8',
      'red': '#ED1C24',
      'orange': '#FF7F27',
    },
  },
  setColor: function(name,c_value){
    name_type = typeof name
    if(name_type === 'string'){
      this.baseConfig.colors[name] = c_value
    }
  },
  setPosition: function(class_name){

    // create the ul box if on the first push
    if (!this.domToastBox) {
      this.initDom()
    }

    if(typeof class_name === 'string'){
      this.domToastBox.className = this.domToastBox.className.replace(' top-center', '').replace(' top-right', '')
      this.domToastBox.className = this.domToastBox.className + ' '+ class_name
    }
  },
  domToastBox: null,
  initDom(){
    let dom_ul = document.createElement('ul')
      dom_ul.className = 'ice-toast-box custom ' + this.baseConfig.position
      document.body.appendChild(dom_ul)
      this.domToastBox = dom_ul

      let dom_style = document.createElement('style')
      dom_style.innerHTML = this.style
      document.body.appendChild(dom_style)
  },
  push: function(xx){
    if (!this.domToastBox) {
      this.initDom()
    }

    // select ul dom
    let ul = this.domToastBox

    // prepare params for li
    let words = ''
    let bgcolor = this.baseConfig.colors.dark
    let time = this.baseConfig.time

    // handel xx type
    let xx_type = typeof xx
    if(!xx_type || xx_type === 'string' || xx_type === 'number'){
      words = xx
    }else if(xx_type === 'object'){
      words = xx.words
      if (xx.bgcolor) bgcolor = xx.bgcolor
      if (xx.time) time = xx.time
    }

    // show li in the dom
    let li = document.createElement('li')
    li.innerHTML = 
      '<div class="ice-toast" style="'+
      'background-color:' + this.baseConfig.colors[bgcolor] +';'+
      '">'+
      words+
      '</div>'
    ul.appendChild(li)

    // remove li in the dom
    this.remove(ul,li,time)
    
  },
  remove(ul,li,time){
    setTimeout(function(){
      ul.removeChild(li)
    },time)
  },
  style: [
    `.ice-toast-box{
      list-style: none;
      position: fixed;
      height: 0;
      box-sizing: border-box;
      margin: 0;
      padding: 0px;
      width: 400px;
      max-width: 100%;
      margin: 0 auto;
      text-align: center;
      z-index: 2030;
    }
    .ice-toast-box.top-center{
      top: 30px;
      left: 50%;
      margin-left: -200px;
    }
    .ice-toast-box.top-right{
      top: 30px;
      right: 30px;
      left: auto;
    }
    .ice-toast-box li{
      margin-bottom: 10px;
    }
    .ice-toast-box .ice-toast{
      box-sizing: border-box;
      padding: 10px 20px;
      background-color: rgba(50,50,50,0.9);
      color: #fff;
      border-radius: 3px;
      text-align: center;
    }`
  ],
}