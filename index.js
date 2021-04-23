/**
 * Step I: The createElement Function
 * Step II: The render Function
 * Step III: Concurrent Mode
 * Step IV: Fibers
 * Step V: Render and Commit Phases
 * Step VI: Reconciliation
 * Step VII: Function Components
 * Step VIII: Hooks
 */

// const element = <h1 title="foo">Hello</h1>

const element = {
    type: 'h1',
    props: {
        title: 'foo',
        children: 'Hello'
    }
}

// const element = React.createElement(
//     'h1',
//     { title: "foo"},
//     'Hello'
// )


const container = document.getElementById("root")


// ReactDOM.render(element, container)

const node = document.createElement(element.type)
node['title'] = element.props.title

const text = document.createTextNode("")
text['nodeValue'] = element.props.children

node.appendChild(text)
container.appendChild(node)

// Step 1: The createElement Function

// const element = (
//     <div id="foo">
//         <a>bar</a>
//         <b />
//     </div>
// )

function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        }
    }
}

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === "object" ? child : createTextElement(child)),
        }
    }
}

const Didact = {
    createElement,
}

// const element = React.createElement(
//     "div",
//     { id: "foo" },
//     React.createElement("a", null, "bar"),
//     React.createElement("b")
// )

// const element = Didact.createElement(
//     "div",
//     { id: "foo" },
//     Didact.createElement("a", null, "bar"),
//     Didact.createElement("b")
// )

/** @jsx Didact.createElement */ 
const element = (
    <div id="foo">
        <a>bar</a>
        <b />
    </div>
)

const container = document.getElementById("root")
ReactDOM.render(element, container)


// Step II: The render Function
function render(element, container) {
    // TODO create dom nodes
    const dom = element.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(element.type)

    const isProperty = key => key != "children"
    Object.keys(element.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = element.props[name]
        })

    element.props.children.forEach(child => {
        render(child, dom)
    })

    container.appendChild(dom)
}

const Didact = {
    createElement, 
    render,
}

// Step III: Concurrent Mode
// 用requestIdleCallback 改写render方法
let nextUnitOfWork = null

function workLoop(deadline) {
    let shouldYield = false
    while(nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        shouldYield = deadline.timeRemaining() < 1
    }
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

// write a performUnitOfWork function that not only performs the work but also returns the next unit of work.

function performUnitOfWork() {
    // TODO
}

// Step IV: Fibers
function createDom(fiber) {
    // TODO create dom nodes
    const dom = 
        element.type === "TEXT_ELEMENT"
            ? document.createTextNode("")
            : document.createElement(fiber.type)

    const isProperty = key => key != "children"
    Object.keys(fiber.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = fiber.props[name]
        })

    return dom
}

function render(element, container) {
    // TODO set next unit of work
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element]
        }
    }

}

let nextUnitOfWork = null

function workLoop(deadline) {
    let shouldYield = false
    while(nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        shouldYield = deadline.timeRemaining() < 1
    }
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

// write a performUnitOfWork function that not only performs the work but also returns the next unit of work.

function performUnitOfWork(fiber) {
    // TODO add dom node
    if(!fiber.dom) {
        fiber.dom = createDom(fiber)
    }

    if(fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom)
    }

    // TODO create new fibers
    const elements = fiber.props.children
    let index = 0
    let prevSibling = null

    while(index < elements.length) {
        const element = elements[index]

        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null,
        }

        if(index === 0) {
            fiber.child = newFiber
        }else {
            prevSibling.sibling = newFiber
        }
        // 将当前节点存为兄长节点，以便下次循环的时候将兄“弟”节点添加到兄“长”节点的sibling上
        prevSibling = newFiber
        index++
    }

    if(fiber.child) {
        return fiber.child
    }
    // 遍历兄弟节点，遍历完成之后，轮到父节点
    let nextFiber = fiber
    while(nextFiber) {
        if(nextFiber.sibling) {
            return nextFiber.sibling
        }
        // 兄弟节点遍历完成，指向父节点
        nextFiber = nextFiber.parent
    }
    

    // TODO return next unit of work
}



// Step V: Render and Commit Phases
// 先看render，render结束之后就能commit

function commitRoot() {
    // TODO add nodes to dom
    // Here we recursively append all the nodes to the dom
    commitWork(wipRoot.child)
    wipRoot = null
}

function commitWork(fiber) {
    if(!fiber) {
        return
    }
    const domParent = fiber.parent.dom
    domParent.appendChild(fiber.dom)
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function render(element, container) {
    // TODO set next unit of work
    // the work in progress root or wipRoot
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        }
    }
    nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let wipRoot= null

function workLoop(deadline) {
    let shouldYield = false
    while(nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        shouldYield = deadline.timeRemaining() < 1
    }

    // 控制是否需要执行commit
    if(!nextUnitOfWork && wipRoot) {
        commitRoot()
    }

    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
    // TODO add dom node
    if(!fiber.dom) {
        fiber.dom = createDom(fiber)
    }

    // 渲染中断会导致不完整的UI展示
    // if(fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom)
    // }

    // TODO create new fibers
    const elements = fiber.props.children
    let index = 0
    let prevSibling = null

    while(index < elements.length) {
        const element = elements[index]

        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null,
        }

        if(index === 0) {
            fiber.child = newFiber
        }else {
            prevSibling.sibling = newFiber
        }
        // 将当前节点存为兄长节点，以便下次循环的时候将兄“弟”节点添加到兄“长”节点的sibling上
        prevSibling = newFiber
        index++
    }

    if(fiber.child) {
        return fiber.child
    }
    // 遍历兄弟节点，遍历完成之后，轮到父节点
    let nextFiber = fiber
    while(nextFiber) {
        if(nextFiber.sibling) {
            return nextFiber.sibling
        }
        // 兄弟节点遍历完成，指向父节点
        nextFiber = nextFiber.parent
    }
    

    // TODO return next unit of work
}

// Step VI: Reconciliation
const isProperty = key => key !== "children"
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
    // TODO
    
}

function commitRoot() {
    // TODO add nodes to dom
    deletions.forEach(commitWork)
    // Here we recursively append all the nodes to the dom
    commitWork(wipRoot.child)
    // 保存当前fiber tree，以便下次commit的时候跟这个树进行比较
    currentRoot = wipRoot

    wipRoot = null
}

function commitWork(fiber) {
    if(!fiber) {
        return
    }
    const domParent = fiber.parent.dom
    if(fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
        domParent.appendChild(fiber.dom)
    } else if(fiber.effectTag === "UPDATE" && fiber.dom != null) {
        updateDom(
            fiber.dom, 
            fiber.alternate.props, 
            fiber.props
        )
    } else if(fiber.effectTag === "DELETION") {
        domParent.removeChild(fiber.dom)
    }

    
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function render(element, container) {
    // TODO set next unit of work
    // the work in progress root or wipRoot
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot,
    }
    deletions = []
    nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let currentRoot = null
let wipRoot= null
let deletions = []

function workLoop(deadline) {
    let shouldYield = false
    while(nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        shouldYield = deadline.timeRemaining() < 1
    }

    // 控制是否需要执行commit
    if(!nextUnitOfWork && wipRoot) {
        commitRoot()
    }

    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
    // TODO add dom node
    if(!fiber.dom) {
        fiber.dom = createDom(fiber)
    }

    // TODO create new fibers
    const elements = fiber.props.children
    reconcileChildren(fiber, elements)

    if(fiber.child) {
        return fiber.child
    }
    // 遍历兄弟节点，遍历完成之后，轮到父节点
    let nextFiber = fiber
    while(nextFiber) {
        if(nextFiber.sibling) {
            return nextFiber.sibling
        }
        // 兄弟节点遍历完成，指向父节点
        nextFiber = nextFiber.parent
    }

    // 渲染中断会导致不完整的UI展示
    // if(fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom)
    // }

    // TODO return next unit of work
}

function reconcileChildren(wipFiber, elements) {
    let index = 0
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child
    let prevSibling = null

    while(index < elements.length || oldFiber != null) {
        const element = elements[index]
        let newFiber = null

        const sameType = oldFiber && element && element.type == oldFiber.type

        if(sameType) {
            // TODO update the node
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE"
            }
        }
        if(element && !sameType) {
            // TODO add this node
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT",
            }
        }
        if(oldFiber && !sameType) {
            // TODO delete the oldFiber's node
            oldFiber.effectTag = "DELETION"
            deletions.push(oldFiber)
        }

        // TODO compare oldFiber to element
        if(oldFiber) {
            
        }




        const newFiber = {
            type: element.type,
            props: element.props,
            parent: wipFiber,
            dom: null,
        }

        if(index === 0) {
            wipFiber.child = newFiber
        }else {
            prevSibling.sibling = newFiber
        }
        // 将当前节点存为兄长节点，以便下次循环的时候将兄“弟”节点添加到兄“长”节点的sibling上
        prevSibling = newFiber
        index++
    }
}