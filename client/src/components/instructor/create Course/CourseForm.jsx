import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud } from "lucide-react";
import api from '@/lib/api';
import { useLanguage } from "@/context/LanguageContext";

const categories = [
  "Computer Science",
  "Programming",
  "Web Development",
  "Business",
  "Marketing",
  "Data Science",
  "Psychology",
  "Finance",
  "Design",
  "Languages",
  "Health & Fitness",
  "Mathematics",
  "Photography",
  "Music",
  "Other",
];

const courseFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  level: z.string().nonempty({ message: "Please select a level." }),
  category: z.string().nonempty({ message: "Please select a category." }),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Price must be a valid number." }),
  requirements: z.string().min(10, { message: "Requirements must be at least 10 characters." }).optional(),
  thumbnail: z.any().optional().refine((file) => !file || file instanceof File, {
    message: "Please upload a valid image file.",
  }).refine((file) => !file || ["image/png", "image/jpeg", "image/gif"].includes(file.type), {
    message: "Only PNG, JPG, or GIF files are allowed.",
  }).refine((file) => !file || file.size <= 10 * 1024 * 1024, {
    message: "File size must be less than 10MB.",
  }),
});


const CourseForm = ({ courseId, setCourseId, setActiveTab, setModules }) => {
  const { t } = useLanguage();
  const form = useForm({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      level: "",
      category: "",
      price: "",
      requirements: "",
      thumbnail: null,
    },
  });

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key === "thumbnail" && value) {
          formData.append(key, value);
        } else if (value) {
          formData.append(key, value);
        }
      });

      if (courseId) {
        // Update existing course only on submit
        const response = await api.put(`/api/courses/${courseId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Course updated successfully");
        setActiveTab("curriculum");
        return;
      }
      const response = await api.post("/api/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newCourseId = response.data._id;
      setCourseId(newCourseId);
      setModules([]);
      form.reset();
      toast.success("Course created successfully");
      setActiveTab("curriculum");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save course");
    }
  };

  // Load existing course data when editing
  useEffect(() => {
    let mounted = true;
    const loadCourse = async () => {
      if (!courseId) return;
      try {
        const res = await api.get(`/api/courses/${courseId}`);
        if (!mounted) return;
        const data = res.data;
        form.reset({
          title: data.title || "",
          description: data.description || "",
          level: data.level || "",
          category: data.category || "",
          price: data.price ? String(data.price) : "",
          requirements: data.requirements || "",
          thumbnail: null,
        });
        // If modules are returned, set them in parent
        if (data.modules && setModules) {
          setModules(data.modules);
        }
      } catch (error) {
        console.error("Failed to load course", error);
      }
    };
    loadCourse();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
        <div>
          <h3 className="text-lg font-medium mb-4">{t("instructor.create.info.title")}</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("instructor.create.label.title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("instructor.create.placeholder.title")}
                      {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("instructor.create.help.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("instructor.create.label.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("instructor.create.placeholder.description")}
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("instructor.create.help.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("instructor.create.label.level")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("instructor.create.placeholder.level")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">{t("instructor.create.level.beginner")}</SelectItem>
                        <SelectItem value="intermediate">{t("instructor.create.level.intermediate")}</SelectItem>
                        <SelectItem value="advanced">{t("instructor.create.level.advanced")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("instructor.create.help.level")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("instructor.create.label.category")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("instructor.create.placeholder.category")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category}
                            value={category.toLowerCase().replace(/\s+/g, "-")}
                          >
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("instructor.create.help.category")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("instructor.create.label.requirements")}</FormLabel>
                  <

FormControl>
                    <Textarea
                      placeholder={t("instructor.create.placeholder.requirements")}
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("instructor.create.help.requirements")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("instructor.create.label.thumbnail")}</FormLabel>
                  <FormControl>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-md">
                      <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                        <div className="flex text-sm">
                          <label
                            htmlFor="thumbnail-upload"
                            className="relative cursor-pointer rounded-md font-medium text-fidel-600 hover:text-fidel-500 focus-within:outline-none"
                          >
                            <span>{t("instructor.create.upload.browse")}</span>
                            <input
                              id="thumbnail-upload"
                              name="thumbnail-upload"
                              type="file"
                              accept="image/png,image/jpeg,image/gif"
                              className="sr-only"
                              onChange={(e) => field.onChange(e.target.files[0])}
                            />
                          </label>
                          <p className="pl-1 text-slate-500 dark:text-slate-400">
                            {t("instructor.create.upload.orDrag")}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t("instructor.create.upload.types")}
                        </p>
                      </div>
                    </div>
                  </FormControl>
                  {field.value && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("instructor.create.upload.selected").replace("{name}", field.value.name)}
                    </p>
                  )}
                  <FormDescription>
                    {t("instructor.create.help.thumbnail")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("instructor.create.label.price")}</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder={t("instructor.create.placeholder.price")}
                      {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("instructor.create.help.price")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end mt-8">
              <Button type="submit" size="lg">
                {t("instructor.create.button.continue")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default CourseForm;