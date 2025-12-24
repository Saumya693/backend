import Course from "../model/courseModel.js";
import Lecture from "../model/lectureModel.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import User from "../model/userModel.js";

export const createCourse = async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title || !category) {
      return res.status(400).json({ message: "title or Category is required" });
    }

    const course = await Course.create({
      title,
      category,
      creator: req.userId, // isAuth middleware se aata hai
    });

    return res.status(201).json(course);
  } catch (error) {
    return res.status(500).json({ message: `CreateCourses error  ${error}` });
  }
};

export const getPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate(
      "lectures"
    );

    if (!courses) {
      return res.status(400).json({ message: "Courses is not found" });
    }

    return res.status(200).json(courses);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to get isPublished Courses  ${error}` });
  }
};

export const getCreaterCourses = async (req, res) => {
  try {
    const userId = req.userId;
    const courses = await Course.find({ creator: userId });
    if (!courses) {
      return res.status(400).json({ message: "Courses are not found" });
    }

    return res.status(200).json(courses);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to get Creater Courses  ${error}` });
  }
};

export const editCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      subTitle,
      description,
      category,
      level,
      isPublished,
      price,
    } = req.body;

    let thumbnail;

    if (req.file) {
      thumbnail = await uploadOnCloudinary(req.file.path);
    }

    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Courses is not found" });
    }

    const updateData = {
      title,
      subTitle,
      description,
      category,
      level,
      isPublished,
      price,
      thumbnail,
    };

    course = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
    });
    return res.status(200).json(course);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to edit Creater Course  ${error}` });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Courses is not found" });
    }
    return res.status(200).json(course);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to get Course by id  ${error}` });
  }
};

export const removeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Courses is not found" });
    }
    course = await Course.findByIdAndDelete(courseId, { new: true });

    return res.status(200).json({ message: "course removed" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to delete Course by id  ${error}` });
  }
};

// for lecture

export const createLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    const { courseId } = req.params;

    if (!lectureTitle || !courseId) {
      return res.status(400).json({ message: "lectureTitle is required" });
    }

    const lecture = await Lecture.create({ lectureTitle });
    const course = await Course.findById(courseId);
    if (course) {
      course.lectures.push(lecture._id);
    }
    await course.populate("lectures");
    await course.save();
    return res.status(201).json({ lecture, course });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to Create Lecture   ${error}` });
  }
};

export const getCourseLecture = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course is not found" });
    }
    await course.populate("lectures");
    await course.save();
    return res.status(200).json(course);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to getCourse Lecture   ${error}` });
  }
};

export const editLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { isPreviewFree, lectureTitle } = req.body;

    const lecture = await Lecture.findById(lectureId);

    if (!lecture) {
      return res.status(404).json({ message: "Lecture is not found" });
    }

    if (req.file) {
      const videoUrl = await uploadOnCloudinary(req.file.path);
      lecture.videoUrl = videoUrl;
    }

    if (lectureTitle) {
      lecture.lectureTitle = lectureTitle;
    }

    lecture.isPreviewFree = isPreviewFree;

    await lecture.save();

    return res.status(200).json(lecture);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "failed to edit Lecture",
    });
  }
};
export const removeLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findByIdAndDelete(lectureId);

    if (!lecture) {
      return res.status(404).json({ message: "Lecture is not found" });
    }

    await Course.updateOne(
      { lectures: lectureId },
      { $pull: { lectures: lectureId } }
    );

    return res.status(200).json({ message: "Lecture Removed" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "failed to remove Lecture",
    });
  }
};

//

export const getCreatorById = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User is not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `Failed to get Creator ${error}` });
  }
};
