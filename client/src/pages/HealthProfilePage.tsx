import { useHealthProfile } from "@/hooks/use-health-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { HealthTipsSidebar } from "@/components/HealthTipsSidebar";

const profileSchema = z.object({
  birthdate: z.string().min(1, "Birthdate is required"),
  sex: z.enum(["male", "female"], {
    required_error: "Please select your sex",
  }),
  heightFeet: z.number({
    required_error: "Height (feet) is required",
    invalid_type_error: "Height must be a number",
  }).min(1, "Height must be at least 1 foot").max(8, "Height cannot exceed 8 feet"),
  heightInches: z.number({
    required_error: "Height (inches) is required",
    invalid_type_error: "Height must be a number",
  }).min(0, "Inches must be between 0 and 11").max(11, "Inches must be between 0 and 11"),
  weightPounds: z.number({
    required_error: "Weight is required",
    invalid_type_error: "Weight must be a number",
  }).min(1, "Weight must be at least 1 pound").max(1000, "Weight cannot exceed 1000 pounds"),
  medicalConditions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function HealthProfilePage() {
  const { profile, isLoading, error, updateProfile } = useHealthProfile();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load health profile. Please try again.",
      });
    }
  }, [error, toast]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      birthdate: "",
      sex: undefined,
      heightFeet: 0,
      heightInches: 0,
      weightPounds: 0,
      medicalConditions: [],
      medications: [],
    },
  });

  // Update form values when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        birthdate: profile.birthdate,
        sex: profile.sex,
        heightFeet: profile.heightFeet,
        heightInches: profile.heightInches,
        weightPounds: profile.weightPounds,
        medicalConditions: profile.medicalConditions,
        medications: profile.medications,
      });
    }
  }, [profile, form.reset]);

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile(data);
    navigate("/lab-results");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,auto]">
      <Card>
      <CardHeader>
        <CardTitle>Health Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="birthdate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birthdate</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sex</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="heightFeet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (feet)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heightInches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (inches)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="weightPounds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (pounds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicalConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Conditions</FormLabel>
                  <div className="space-y-2">
                    {field.value.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={condition}
                          onChange={(e) => {
                            const newConditions = [...field.value];
                            newConditions[index] = e.target.value;
                            field.onChange(newConditions);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            field.onChange(
                              field.value.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => field.onChange([...field.value, ""])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Condition
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medications</FormLabel>
                  <div className="space-y-2">
                    {field.value.map((medication, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={medication}
                          onChange={(e) => {
                            const newMedications = [...field.value];
                            newMedications[index] = e.target.value;
                            field.onChange(newMedications);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            field.onChange(
                              field.value.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => field.onChange([...field.value, ""])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medication
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Save and Continue
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
    <HealthTipsSidebar />
    </div>
  );
}
