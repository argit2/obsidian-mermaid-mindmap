// @ts-check
function getIndentation(line) {
    const spaces = line.split('-')[0];
    if (! spaces) {
        return 0;
    }
    const indentation = spaces.length;
    return indentation;
}

function getChildrenIndexes(lines, lineNumber) {
    if (lineNumber >= lines.length - 1) {
        return [];
    }
    let i = lineNumber + 1;
    const parent = lines[lineNumber];
    const parentIndentation = getIndentation(parent);
    let childrenIndexes = [];
    let childrenIndentation = getIndentation(lines[lineNumber + 1]) 
    // no children
    if (childrenIndentation <= parentIndentation) {
        return [];
    }
    while (i < lines.length) {
        const indentation = getIndentation(lines[i]);
        if (indentation == parentIndentation) {
            break;
        }
        if (indentation == childrenIndentation) {
            childrenIndexes.push(i)
        }
        i += 1;
    }
    return childrenIndexes;
}

// 0 is A
function numberToLetter(value) {
    return (value + 10).toString(36).toUpperCase();
}
// {lineNumber : lineIndexInMermaid}
// example: {1 : "A", 2 : "B"}
function createIndexesDict (lines) {
    const lineNumbers = [...Array(lines.length).keys()];
    const entries = lineNumbers.map(lineNumber => {
        let bracket = getBracket(lines[lineNumber]);
        bracket = addUnderscore(bracket);
        let alphabeticIndex = lineNumber.toString().split('').map(c => numberToLetter(parseInt(c))).join('');
        let index = bracket ? bracket : alphabeticIndex;
        return [lineNumber, index];
    })
    const dict = Object.fromEntries(entries);
    return dict;
}

function addUnderscore(bracket) {
    return bracket.replace(' ', '_')
}

function getBracket(line) {
    let match = line.match(/\[.*?\]/gi);
    if (! match || match.length == 0) {
        return '';
    }
    const bracket = match[match.length - 1];
    const inside = bracket.replace('[', '').replace(']', '');
    return inside;
}

// removes indentation and - from the beginning of line
function getCleanLine(line) {
    if (! line) {
        return ''
    }
    const arr = line.split('- ');
    if (arr.length <= 1) {
        return '';
    }
    const noIndentation = arr[1];

    const noBrackets = noIndentation.replace(/\[.*?\]/, '');
    return noBrackets;
}

function cleanEmptyLines(lines) {
    const clean = lines.filter(line => {
        const isEmpty = line.replace(/\s\n?/gi, '').length == 0;
        return ! isEmpty;
    })
    return clean;
}

// mindmap has to be the same way markmap does it for lists
// - something
//   - child
//   - child2
// - other thing
const mermaidIndent = '  '
function convertMindmapToMermaid(lines) {
    lines = cleanEmptyLines(lines)
    const indexesDict = createIndexesDict(lines);
    const definitions = lines.map((line, lineNumber) => {
        const index = indexesDict[lineNumber];
        const cleaned = getCleanLine(line);
        return `${index}[${cleaned}]`
    })
    const connections = []
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
        const line = lines[lineNumber];
        const parentIndex = indexesDict[lineNumber];
        const childrenIndexes = getChildrenIndexes(lines, lineNumber);
        if (! childrenIndexes || childrenIndexes.length == 0) {
            continue;
        }
        const arrow = '-->'
        const convertedChildren = childrenIndexes.map(lineNumber => {
            const childIndex = indexesDict[lineNumber];
            return `${parentIndex}${arrow}${childIndex}`;
        })
        convertedChildren.forEach(convertedChild => {
            connections.push(convertedChild);
        })
    }
    const mermaidLines = [...definitions, ...connections].map(x => {
        return `${mermaidIndent}${x};`;
    });
    const mermaid = 'graph TD;\n' + mermaidLines.join('\n');
    return mermaid;
}

// syntax: something --> somethingElse
// those brackets have already been mentioned and converted properly on the mindmap part
// so now we just need to make sure the syntax matches mermaid
function convertArrowsToMermaid(lines) {
    const convertedLines = lines.map(line => {
        const split = line.split('-->');
        const underscored = split.map(x => {
            return addUnderscore(x.trim());
        }).join('-->');
        let convertedLine =  `${mermaidIndent}${underscored}`
        if (! line.match(/;\s*$/gi)) {
            convertedLine = convertedLine + ';';
        }
        return convertedLine;
    })
    const mermaid = convertedLines.join('\n');
    return mermaid;
}

const text = `
- item1[whatever]
	- item2
- item3
	- item4[something]

whatever --> something
`

function replaceTabs(text, tabSize=4) {
    const lines = text.split('\n');
    const replacedLines = lines.map(line => {
        const match = line.match(/^\t+/gi);
        if (! match || match.length == 0) {
            return line;
        }
        const tabs = match[0];
        const indentation = ' '.repeat(tabSize * tabs.length)
        return line.replace(tabs, indentation)
    })
    return replacedLines.join('\n');
}

export function textToMermaid(text) {
    const cleanText = replaceTabs(text, 4);
    const lines = cleanText.split('\n');
    const mindMapLines = lines.filter(line => {
        return line.match(/^[ ]*\-/gi);
    })
    const arrowLines = lines.filter(line => {
        return line.match(/-->/gi);
    })
    const mermaid1 = convertMindmapToMermaid(mindMapLines);
    const mermaid2 = convertArrowsToMermaid(arrowLines)
    const mermaid = mermaid1 + '\n' + mermaid2; 
    return mermaid;
}

function main() {
    textToMermaid(text);
}

main();