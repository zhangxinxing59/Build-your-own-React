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

// Didact 完整代码

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

// Step VI: Reconciliation
// 区别处理event listeners
const isEvent = key => keys.startWith("on")
// 处理属性，删除或更新
const isProperty = key => key !== "children" && !isEvent(key)
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
    // 事件代理变了，则remove掉
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            key => 
                !(key in nextProps) ||
                isNew(prevProps, nextProps)(key)
        )
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2)
            dom.removeEventListener(
                eventType, prevProps[name]
            )
        })

    // Remove old properties
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => {
            dom[name] = ""
        })
    
    // Set new or changed properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name]
        })

    // 增加新的事件处理
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2)
            dom.addEventListener(
                eventType,
                nextProps[name]
            )
        })
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

// 改写commitWork
function commitWork(fiber) {
    if(!fiber) {
        return
    }
    // const domParent = fiber.parent.dom
    // fiber 没有dom节点，就一直往上找父节点的dom
    let domParentFiber = fiber.parent
    while(!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom

    if(fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
        domParent.appendChild(fiber.dom)
    } else if(fiber.effectTag === "UPDATE" && fiber.dom != null) {
        updateDom(
            fiber.dom, 
            fiber.alternate.props, 
            fiber.props
        )
    } else if(fiber.effectTag === "DELETION") {
        // domParent.removeChild(fiber.dom)
        commitDeletion(fiber, domParent)
    }

    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
    if(fiber.dom) {
        domParent.removeChild(fiber.dom)
    }else {
        commitDeletion(fiber.child, domParent)
    }
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

// 改写performUnitOfWork
function performUnitOfWork(fiber) {
    // TODO add dom node
    // if(!fiber.dom) {
    //     fiber.dom = createDom(fiber)
    // }

    // // TODO create new fibers
    // const elements = fiber.props.children
    // reconcileChildren(fiber, elements)

    const isFunctionComponent = fiber.type instanceof Function
    if(isFunctionComponent) {
        updateFunctionComponent(Fiber)
    } else {
        updateHostComponent(fiber)
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

    // 渲染中断会导致不完整的UI展示
    // if(fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom)
    // }

    // TODO return next unit of work
}

// 新增全局变量
let wipFiber = null
let hookIndex = null

function updateFunctionComponent(fiber) {
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []
    const children = [fiber.type(fiber.props)]   // fiber.type == App, App(fiber.props) ====> h1 element
    reconcileChildren(fiber, children)
}

function useState(initial) {
    // TODO useState 返回的是[state, setState], [状态，状态函数]
    const oldHook = 
        wipFiber.alternate && 
        wipFiber.alternate.hooks &&
        wipFiber.alternate.hooks[hookIndex]
    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    }

    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
        hook.state = action(hook.state)
    })

    const setState = action => {
        hook.queue.push(action)
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        }
        nextUnitOfWork = wipRoot
        deletions = []
    }
    
    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state, setState]
}

function updateHostComponent(fiber) {
    if(!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props.children)
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
            oldFiber = oldFiber.sibling
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

// 加入state
const Didact = {
    createElement,
    render,
    useState,
}

/** @jsx Didact.createElement */ 
function Counter() {
    const [state, setState] = Didact.useState(1)
    return (
        <h1 onClick={() => setState(c => c + 1)}>
            Count: {state}
        </h1>
    )
}
const element = <Counter />
const container = document.getElementById("root")
Didact.render(element, container)
