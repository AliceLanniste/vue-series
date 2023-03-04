//解析html
const ncname = '[a-zA-Z_][\\w\\-\\.]*';
const singleAttrIdentifier = /([^\s"'<>/=]+)/
const singleAttrAssign = /(?:=)/
const singleAttrValues = [
  /"([^"]*)"+/.source,
  /'([^']*)'+/.source,
  /([^\s"'=<>`]+)/.source
]
const attribute = new RegExp(
  '^\\s*' + singleAttrIdentifier.source +
  '(?:\\s*(' + singleAttrAssign.source + ')' +
  '\\s*(?:' + singleAttrValues.join('|') + '))?'
)

const qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')'
const startTagOpen = new RegExp('^<' + qnameCapture)
const startTagClose = /^\s*(\/?)>/

const endTag = new RegExp('^<\\/' + qnameCapture + '[^>]*>')

const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g

const forAliasRE = /(.*?)\s+(?:in|of)\s+(.*)/

let htmlStr = '<div :class="c" class="demo" v-if="isShow"><span v-for="item in sz">{{item}}</span></div>'
let index =0, root = null,stack=[],currentParent =null

function advance(length) {
    index += length
    return htmlStr.substring(length)

}


function parse(str) {
    return parseHTML(str)
}


function parseHTML(html) {
    while (html) {
        if (html.match(startTagOpen)) {
            let startMatch = parseStartTag(html)
            let element = {
                type:1,
                tagName:startMatch.tagName,
                attributes:startMatch.attrs,
                currentParent:currentParent,
                children:[]
            }

            if(!root) {
                root = element
            }
            if (currentParent) {
                element.currentParent = currentParent
            }

            if (!startMatch.startEnd) {
                stack.push(element)
                currentParent= element
            }
            html = html.substring(startMatch.end)
            continue
        }
        if (html.match(endTag)) {
            let endMatch = html.match(endTag)
            parseEndTag(endMatch[1])
            html = advance(endMatch[0].length)

        } else {

        }

    }
}


function parseText(params) {
    
}



function parseStartTag(str) {
    const start = str.match(startTagOpen)
    if (start) {
        const match = {
            tagName: start[1],
            attrs:[],
            start:index,
        }
    
    str= str.substring(start[0].length)
    let end,attr,attrLength=0;
    while (!(end === str.match(startTagClose)) &&(attr===str.match(attribute))) {
        str = str.substring(attr[0].length)
        attrLength+=attr[0].length 
        match.attrs.push({
            name:attr[1],
            value:attr[3]
        })
      }

      if (end) {
        match.startEnd = end[1]
        match.end =attrLength+start[0].length
         return match
      }
    }
}



function parseEndTag(params) {
    
}
