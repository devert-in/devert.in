import FeatureGuard from "@/components/feature-guard";
import ClientCourseDetail from "./client-page";

export async function generateStaticParams() {
    return [{ id: 'demo-prompt' }];
}

export default async function CourseDetailPage({ params }) {
    const { id } = await params;
    return (
        <FeatureGuard feature="courses">
            <ClientCourseDetail id={id} />
        </FeatureGuard>
    );
}
