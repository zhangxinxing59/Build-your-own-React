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

        prevSibling = newFiber
        index++
    }

    if(fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while(nextFiber) {
        if(nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
    

    // TODO return next unit of work
}
