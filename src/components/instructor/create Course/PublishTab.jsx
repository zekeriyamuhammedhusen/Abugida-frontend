import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import api from '@/lib/api';
import { useLanguage } from "@/context/LanguageContext";

const PublishTab = ({ courseId, modules, initialPublished }) => {
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleSave = async () => {
    if (!courseId || modules.length === 0) {
      toast.error(t("instructor.publish.error.missing"));
      return;
    }

    try {
      setIsLoading(true);

      const res = await api.patch(`/api/courses/${courseId}/status`, { published: isPublished });

      toast.success(res.data.message);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update course status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">{t("instructor.publish.title")}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t("instructor.publish.subtitle")}
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <h4 className="font-medium mb-2">{t("instructor.publish.checklist")}</h4>
          <ul className="space-y-1">
            <li className="flex items-center text-sm">
              <div className="h-4 w-4 rounded-full mr-2 bg-green-500"></div>
              {t("instructor.publish.item.meta")}
            </li>
            <li className="flex items-center text-sm">
              <div className="h-4 w-4 rounded-full mr-2 bg-green-500"></div>
              {t("instructor.publish.item.module")}
            </li>
            <li className="flex items-center text-sm">
              <div className="h-4 w-4 rounded-full mr-2 bg-green-500"></div>
              {t("instructor.publish.item.price")}
            </li>
          </ul>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <Label htmlFor="publish-switch">{t("instructor.publish.label.switch")}</Label>
          <Switch
            id="publish-switch"
            checked={isPublished}
            onCheckedChange={(checked) => setIsPublished(checked)}
          />
          <span className="text-sm text-muted-foreground">
            {isPublished
              ? t("instructor.publish.state.published")
              : t("instructor.publish.state.draft")}
          </span>
        </div>

        <Button
          type="button"
          size="lg"
          disabled={isLoading}
          onClick={handleSave}
        >
          {isLoading
            ? t("instructor.publish.button.saving")
            : isPublished
            ? t("instructor.publish.button.publish")
            : t("instructor.publish.button.draft")}
        </Button>
      </div>
    </div>
  );
};

export default PublishTab;
