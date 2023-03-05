/**
 * 将类vue模板字符串解析成js对象
 */
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
                attributeMap:makeAttrsMap(startMatch.attrs),
                currentParent:currentParent,
                children:[]
            }
            processIf(element)
            processFor(element)
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
    const tokens = [];
    defaultTagRE.lastIndex =0
    let match, index
    while ((match = defaultTagRE.exec(text))) {
        index = match.index
        const exp = match[1].trim()
        tokens.push(exp)
    }

    return tokens.join('+');
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


function processIf(el) {
    let exp = getKey(el,'v-if')
    if (exp) {
        el.if = exp;
        if (!el.ifConditions) {
            el.ifConditions = [];
        }
        el.ifConditions.push({
            exp: exp,
            block: el
        }); 
    }
}


function processFor(el) {
    let exp;
    if ((exp =getKey(el, 'v-for'))) {
        const inMatch = exp.match(forAliasRE);
        el.for = inMatch[2].trim();
        el.alias = inMatch[1].trim();
    }
}
function getKey(el,name) {
    let value;
    if ((value = el.attributeMap[name]) !== null) {
        const list = el.attributes
        for (let index = 0; index < list.length; index++) {
            if (list[index].name === name ) {
                list.splice(index, 1)
                break
            }
            
        }
    }
    return value
}

function makeAttrsMap(attrList) {
    const attrMap = {}
    for (let index = 0; index < attrList.length; index++) {
        let name = attrList[index].name
        let value = attrList[index].value
        attrMap[name] =value
    }
    return attrMap
}
// markStatic
function optimize(ast) {
    function isStatic(node) {
        if (node.type === 2) {
            return false
        }
        if (node.type === 3) {
            return true
        }
        return (!node.if && !node.for);
    }

    function markStatic(node) {
        node.static = isStatic(node)
        if (node.type === 1) {
            for (let index = 0; index < node.children.length; index++) {
                const child = node.children[index]
                markStatic(child)
                if (!child.static) {
                    node.static = false
                }
            }
        }
      
    }

    function markStaticRoots (node) {
        if (node.type === 1) {
            if (node.static && node.children.length && !(
            node.children.length === 1 &&
            node.children[0].type === 3
            )) {
                node.staticRoot = true;
                return;
            } else {
                node.staticRoot = false;
            }
        }
    }

    markStatic(rootAst);
    markStaticRoots(rootAst);
}


let rootAst = parse(htmlStr)
optimize(rootAst)
console.log('rootAst',rootAst)


