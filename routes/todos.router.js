import express from "express";
import joi from 'joi';
import Todo from '../schemas/todo.schema.js';
const router = express.Router();

// **할 일 생성 API 유효성 검사 요구사항**

// 1. `value` 데이터는 **필수적으로 존재**해야한다.
// 2. `value` 데이터는 **문자열 타입**이어야한다.
// 3. `value` 데이터는 **최소 1글자 이상**이어야한다.
// 4. `value` 데이터는 **최대 50글자 이하**여야한다.
// 5. 유효성 검사에 실패했을 때, 에러가 발생해야한다.
const createdTodoSchema = joi.object({
  title: joi.string().min(1).max(50).required(),
  content: joi.string().min(1).max(50).required(),
  author: joi.string().min(1).max(50).required(),
  password: joi.string().min(1).max(50).required(),
});

/*** 판매 등록 API*/
// 1. 클라이언트로 부터 받아서 value 데이터를 가져온다. 
router.post('/todos', async (req, res, next) => {
  try {
    const validation = await createdTodoSchema.validateAsync(req.body);

    const { title, content, author, password, } = validation;

    // 1-5. 만약, 클라이언트가 value 데이터를 전달하지 않았을 때, 클라이언트에게 에러 메세지를 전달한다.
    if (!title || !content || !author || !password) {
      return res
        .status(400)
        .json({ errorMessage: '품목 데이터가 존재하지 않습니다.' });
    }

    // 2. 해당하는 마지막 order 데이터를 조회한다.
    // findOnde = 1개의 데이터만 조회한다.
    // sort = 정렬한다. -> 어떤 컬럼을?
    const sellMaxOrder = await Todo.findOne().sort('-order').exec();
    // 3. 만약 존재한다면 현재 해야 할 일을 +1 하고, order 데이터가 존재하지 않다면, 1 로 할당한다.
    const neworder = sellMaxOrder ? sellMaxOrder.order + 1 : 1;

    // 4. 판매 물건 등록
    const todo = new Todo({ title, content, author, password, order: neworder });
    await todo.save();
    // 5. 해야할 일을 클라이언트에게 반환한다.
    return res.status(201).json({ todo: todo });
  } catch (error) {
    // Router 다음에 있는 에러 처리 미들웨어를 실행한다.
    next(error);
  }
});

// 판매 목록 조회 API //
router.get('/todos', async (req, res, next) => {
  // 1. 판매 목록 조회를 진행한다.
  const todos = await Todo.find().sort('-order')
  .select('title author password status createdAt')
  .exec();

  // 2. 해야할 일 목록 조회 결과를 클라이언트에게 반환한다.
  return res.status(200).json({ todos });
});

router.get('/todos/:todoId', async (req, res, next) => {
    // 1. 상세 목록 조회를 진행한다.
    const { todoId } = req.params;
    const todos = await Todo.findById(todoId).exec();
  
    // 2. 해야할 일 목록 조회 결과를 클라이언트에게 반환한다.
    return res.status(200).json({ todos });
  });

/** 해야할 일 순서 변경, 완료 / 해제, 내용 변경 API*/
router.patch('/todos/:todoId', async (req, res, next) => {
  const { todoId } = req.params;
  const { title ,password, status, content, done } = req.body;

  // 현재 나의 order가 무엇인지 알아야한다.
  const currentTodo = await Todo.findById(todoId).exec();
  if (currentTodo.password !== password) {
    return res
      .status(404)
      .json({ errorMessage: '존재하지 않는 비밀번호입니다.' });
  }

  if (done !== undefined) {
    currentTodo.doneAt = done ? new Date() : null;
  }

  currentTodo.content = content;
  currentTodo.title = title;
  currentTodo.status = status;
 
  await currentTodo.save();

  return res.status(200).json({});
});

//** 물건 삭제 API * */
router.delete('/todos/:todoId', async (req, res, next) => {
  const { todoId } = req.params;
  const { password } = req.body;
  const todo = await Todo.findById(todoId).exec();
  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: '상품 조회에 실패하였습니다.' });
  }
  if (todo.password !== password) {
    return res
      .status(404)
      .json({ errorMessage: '비밀번호가 틀렸습니다.' });
  }

  await Todo.deleteOne({ _id: todoId });

  return res.status(200).json({});
});
export default router;
