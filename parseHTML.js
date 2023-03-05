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
                lowerCasedTag:startMatch.tagName.toLowerCase(),
                attributes:startMatch.attrs,
                currentParent:currentParent,
                children:[]
            }
            if(!root) {
                root = element
               
            }
            if (currentParent) {
                currentParent.children.push(element);
            }

            if (!startMatch.startEnd) {
                stack.push(element)
                currentParent= element
            }
            html = html.substring(startMatch.offset)
            continue
        }
      
        if (html.match(endTag)) {
            let endMatch = html.match(endTag)
            parseEndTag(endMatch[1])
            html = html.substring(endMatch[0].length)
          
            continue
        } 
        
        if (html.indexOf('<') > 0) {
            
            const textEnd = html.indexOf('<')
            let text =html.substring(0,textEnd)
            let expression
            if (expression = parseText(text)) {
                currentParent.children.push({
                    type: 2,
                    text,
                    expression
                })
            } else {
                currentParent.children.push({
                    type: 3,
                    text,
                })
            }
            html = html.substring(text.length)
            continue
        }
        
    }
    return root
}


function parseText(text) {
    if (!defaultTagRE.test(text)) return
    const tokens=[]
    let match;
    

    while ((match = defaultTagRE.exec(text))) {
        const exp = match[1].trim()
        tokens.push(exp)
    }
    return tokens.join('')
}



function parseStartTag(str) {
    let end,attr,offset=0;
    const start = str.match(startTagOpen)
    if (start) {
        const match = {
            tagName: start[1],
            attrs:[],
            start:index,
            offset:start[0].length
        }
    
        str= str.substring(start[0].length)
        offset+=start[0].length

        while (!(end = str.match(startTagClose)) &&(attr=str.match(attribute))) {
            str = str.substring(attr[0].length)
            offset+=attr[0].length 
            match.attrs.push({
                name:attr[1],
                value:attr[3]
            })
        }
        if (end) {
            match.startEnd = end[1]
            match.end =index+offset+end[0].length
            match.offset = offset+end[0].length
            index = match.end
            return match
        }
    }
}



function parseEndTag(match) {
    let pointer
    for ( pointer = stack.length-1; pointer >=0;pointer--) {
        if (stack[pointer].lowerCasedTag === match.toLowerCase()) {
            break
        }
        
    }

    if (pointer > 0) {
        currentParent =stack[pointer-1]
    } else {
        currentParent =null
    }
    stack.length =pointer
}


let rootAst = parse(htmlStr)
console.log('rootAst',rootAst)