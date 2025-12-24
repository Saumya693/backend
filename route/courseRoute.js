import express from "express";
import {
  createCourse,
  createLecture,
  editCourse,
  editLecture,
  getCourseById,
  getCourseLecture,
  getCreatorById,
  getCreaterCourses,
  getPublishedCourses,
  removeCourse,
  removeLecture,
} from "../controllers/courseController.js";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { searchwithAi } from "../controllers/searchController.js";

const courseRouter = express.Router();

courseRouter.post("/create", isAuth, createCourse);
courseRouter.get("/getpublished", getPublishedCourses);
courseRouter.get("/getcreator", isAuth, getCreaterCourses);

courseRouter.post(
  "/editcourse/:courseId",
  isAuth,
  upload.single("thumbnail"),
  editCourse
);
courseRouter.get("/getcourse/:courseId", isAuth, getCourseById);
courseRouter.delete("/remove/:courseId", isAuth, removeCourse);

//for lectures

courseRouter.post("/createlecture/:courseId", isAuth, createLecture);
courseRouter.get("/courselecture/:courseId", isAuth, getCourseLecture);
courseRouter.post(
  "/editlecture/:lectureId",
  isAuth,
  upload.single("videoUrl"),
  editLecture
);
courseRouter.delete("/removelecture/:lectureId", isAuth, removeLecture);
courseRouter.post("/creator", isAuth, getCreatorById);

// search with ai
courseRouter.post("/search", searchwithAi);

export default courseRouter;
