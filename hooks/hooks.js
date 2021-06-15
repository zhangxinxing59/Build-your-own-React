// 以App实例为操作对象的hooks
// 可以将工作分为两部分
// 1. 通过一些途径产生更新， 更新会造成组件render
// 2. 组件render时useState返回的num为更新的结果
// 步骤1的更新分为mount和update两种
// （1）调用ReactDOM.render产生mount的更新，更新内容为useState的initialValue
// （2）点击p标签触发updateNum会产生一次update更新，更新内容为num => num + 1

// 更新就是如下的数据结构, 多个更新形成环状单向链表
const update = {
    // 更新执行的函数
    action,
    // 与同一个Hook的其他更新形成链表
    next: null
}

// 调用updateNum实际上调用的时dispatchAction.bind(null, hook.queue)
function dispatchAction(queue, action) {
    // 创建update
    const update = {
        action, 
        next: null
    }

    // 环状单向链表操作
    if (queue.pending === null) {
        update.next = update
    } else {
        update.next = queue.pending.next
        queue.pending.next = update
    }
    queue.pending = update

    // 模拟React开始调度更新
    schedule()
}

// App组件对应的fiber对象, update保存载在fiber
const fiber = {
    // 保存该Function component对应的hooks链表
    memoizedState: null,
    // 指向App函数
    stateNode: App
}

// hook数据结构（保存在fiber.memoizedState） 单向链表
// 每个useState对应一个hook对象。
// 调用const [num, updateNum] = useState(0);时updateNum（即上文介绍的dispatchAction）产生的update保存在useState对应的hook.queue中。
const hook = {
    // 保存update的queue，即上文介绍的queue
    queue: {
        pending: null
    },
    // 保存hook对应的state
    memoizedState: initialState,
    // 与下一个hook连接形成的单向无环链表
    next: null
}

// 实现react的调度更新流程
// 用isMount指代mount还是update
// 首次render时是mount
let isMount = true
function schedule() {
    // 更新前将workInProgressHook重置为fiber保存的第一个hook
    workInProgressHook = fiber.memoizedState
    // 触发组件的render
    fiber.stateNode()
    // 组件首次render为mount，以后再触发的更新为update
    isMount = false
}



// 第2步，组件render时useState返回的num为更新后的结果
// 组件render时会调用useState，他的大体逻辑如下
function useState(initialState) {
    // 当前useState使用的hook会被赋值该变量
    let hook

    if(isMount) {
        //  ...mount时需要生成的hook对象
        hook = {
            queue: {
                pending: null
            },
            memoizedState: initialState,
            next: null
        }

        // 将hook插入fiber.memoizedState链表末尾
        if (!fiber.memoizedState) {
            fiber.memoizedState = hook
        } else {
            workInProgressHook.next = hook    // 前面schedule函数中赋值了fiber.memoizedState
        }
        // 移动workInprogressHook指针
        workInProgressHook = hook
    } else {
        // ...update时从workInProgressHook中取出该useState对应的hook
        update = workInProgressHook
        // 移动workInProgressHook指针
        workInProgressHook = workInProgressHook.next
    }

    let baseState = hook.memoizedState
    if(hook.queue.pending) {
        // ...根据queue.pending中保存的update更新state
        // 获取update环状单向链表中第一个update
        let firstUpdate = hook.queue.pending.next

        do {
            // 执行update action
            const action = firstUpdate.action
            baseState = action(baseState)
            firstUpdate = firstUpdate.next

            // 最后一个update执行完后跳出循环
        } while (firstUpdate !== hook.queue.pending.next)

        // 清空queue.pending
        hook.queue.pending = null

    }
    hook.memoizedState = baseState

    return [baseState, dispatchAction.bind(null, hook.queue)]
}


