"use client";

// Next imports
import { useFormik } from "formik";
import { toast } from "sonner";
import * as Yup from "yup";
// Images

const ContactUs = () => {
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    contactNo: Yup.string()
      .matches(/^\d{10}$/, "Contact number must be 10 digits")
      .required("Contact number is required"),
    city: Yup.string().required("City is required"),
    schoolName: Yup.string().optional(),
  });

  // ✅ useFormik hook
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      contactNo: "",
      city: "",
      schoolName: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const result = await response.json();
        if (result.result === "success") {
          toast.success("Form submitted successfully ✅");
          resetForm();
        } else {
          toast.error("Something went wrong ❌");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
      }
    },
  });

  return (
    <div className="mt-8 w-full h-full overflow-hidden px-4 py-12 bg-[#FEC106] relative">
      <div className="md:w-[950px] w-full bg-[#FDFBF3] rounded-[16px] max-w-full h-full mx-auto px-4 md:px-20 py-14">
        <h2 className="mb-2 text-[#403A02] md:text-[42px] text-[28px] md:leading-[50px] leading-[34px] font-semibold text-center">
          Ready to Start the Adventure?
        </h2>
        <p className="mb-8 text-[#403A02] md:text-[20px] text-[16px] md:leading-[24px] leading-[18px] font-normal text-center">
          Join thousands of families who make learning about the world a daily adventure!
        </p>
        <div className="md:w-[600px] w-full mx-auto md:bg-white rounded-[20px] md:border md:border-[#D9D9D9] md:p-10 p-3">
          <form onSubmit={formik.handleSubmit}>
            {/* Name */}
            <div className="mb-4 flex flex-col gap-[5px]">
              <label htmlFor="name" className="text-[#022C40] text-[16px]">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
                className="w-full border border-[#D9D9D9] rounded-full px-4 py-2"
              />
              {formik.touched.name && formik.errors.name && (
                <div className="text-red-500 text-sm">{formik.errors.name}</div>
              )}
            </div>

            {/* Email */}
            <div className="mb-4 flex flex-col gap-[5px]">
              <label htmlFor="email" className="text-[#022C40] text-[16px]">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className="w-full border border-[#D9D9D9] rounded-full px-4 py-2"
              />
              {formik.touched.email && formik.errors.email && (
                <div className="text-red-500 text-sm">{formik.errors.email}</div>
              )}
            </div>

            {/* Contact No */}
            <div className="mb-4 flex flex-col gap-[5px]">
              <label htmlFor="contactNo" className="text-[#022C40] text-[16px]">
                Contact No *
              </label>
              <input
                type="text"
                id="contactNo"
                name="contactNo"
                placeholder="Contact No"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.contactNo}
                className="w-full border border-[#D9D9D9] rounded-full px-4 py-2"
              />
              {formik.touched.contactNo && formik.errors.contactNo && (
                <div className="text-red-500 text-sm">{formik.errors.contactNo}</div>
              )}
            </div>

            {/* City */}
            <div className="mb-4 flex flex-col gap-[5px]">
              <label htmlFor="city" className="text-[#022C40] text-[16px]">
                City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                placeholder="City"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.city}
                className="w-full border border-[#D9D9D9] rounded-full px-4 py-2"
              />
              {formik.touched.city && formik.errors.city && (
                <div className="text-red-500 text-sm">{formik.errors.city}</div>
              )}
            </div>

            {/* School Name */}
            <div className="mb-4 flex flex-col gap-[5px]">
              <label htmlFor="schoolName" className="text-[#022C40] text-[16px]">
                School Name
              </label>
              <input
                type="text"
                id="schoolName"
                name="schoolName"
                placeholder="School Name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.schoolName}
                className="w-full border border-[#D9D9D9] rounded-full px-4 py-2"
              />
              {formik.touched.schoolName && formik.errors.schoolName && (
                <div className="text-red-500 text-sm">{formik.errors.schoolName}</div>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="mt-4 w-[270px] h-[40px] bg-[#FEC106] text-white cursor-pointer text-base px-6 py-2 rounded-[50px] font-semibold"
              >
                {formik.isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
