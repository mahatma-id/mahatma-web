import { redirect } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCategorySlug } from '@/lib/insight';

export default async function BeritaDetailRedirect({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  let categorySlug = 'berita';
  try {
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      categorySlug = getCategorySlug(docSnap.data().category);
    }
  } catch (e) {
    // default to berita
  }

  redirect(`/insight/${categorySlug}/${id}`);
}
