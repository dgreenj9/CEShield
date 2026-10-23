import CoursesPage from '@/views/CoursesPage';
import discovered from '@/data/education/discoveredCourses.json';
import curated from '@/data/education/courses.json';
import unavailable from '@/data/education/unavailableCourses.json';
import registry from '@/data/education/providers.json';
import { mergeCourseListings } from '@/utils/educationCatalog';
import { ledgerDraft } from '@/utils/educationPlanning';

export default async function Page({searchParams}) {
  const params=await searchParams;
  const id=typeof params?.catalogCourse==='string'?params.catalogCourse:'';
  const course=id?mergeCourseListings(discovered,curated,unavailable).find(c=>c.id===id || c.aliases?.includes(id)):null;
  const initialCourse=course?ledgerDraft({...course,providerName:registry.providers.find(p=>p.id===course.providerId)?.name||course.providerId}):null;
  return <CoursesPage key={id} initialCourse={initialCourse} />;
}
