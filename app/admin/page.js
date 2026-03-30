"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, getDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import 'react-quill-new/dist/quill.snow.css';
import Link from 'next/link';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeTab, setActiveTab] = useState('umum');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const quillRef = useRef(null);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'mahatma_upload'); 
    const cloudName = 'dgexjl9sf'; 

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || "Gagal upload file");
  };

  const imageHandler = () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = async () => {
          const file = input.files[0];
          if (file) {
              setLoading(true);
              try {
                  const url = await uploadToCloudinary(file);
                  const quill = quillRef.current.getEditor();
                  const range = quill.getSelection(true);
                  quill.insertEmbed(range.index, 'image', url);
                  quill.setSelection(range.index + 1);
              } catch (error) { alert("Gagal mengunggah gambar ke dalam teks."); }
              setLoading(false);
          }
      };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'], 
        ['clean']
      ],
      handlers: { image: imageHandler } 
    }
  }), []);

  // STATE UMUM & FOOTER
  const [settings, setSettings] = useState({ 
      logoUrl: '', logoDarkUrl: '', 
      missionTitle: '', missionDesc: '', missionImageUrl: '', 
      mission1Desc: '', mission2Desc: '', mission3Desc: '', mission4Desc: '',
      serviceTitle: '', serviceDesc: '', serviceImageUrl: '',
      aboutTitle: '', aboutDesc: '', aboutImageUrl: '', 
      ctaTitle: '', ctaDesc: '', ctaLink: '',
      footerDesc: '', phone: '', email: '', address: '', mapUrl: '', mapLink: '',
      linkedin: '', youtube: '', instagram: ''
  });
  
  // STATE SLIDER & LAINNYA
  const [sliders, setSliders] = useState([]);
  const [editSliderId, setEditSliderId] = useState(null);
  const [slideTagline, setSlideTagline] = useState(''); const [slideTitle, setSlideTitle] = useState(''); const [slideSubtitle, setSlideSubtitle] = useState(''); const [slideBtn1Text, setSlideBtn1Text] = useState(''); const [slideBtn1Link, setSlideBtn1Link] = useState(''); const [slideBtn2Text, setSlideBtn2Text] = useState(''); const [slideBtn2Link, setSlideBtn2Link] = useState(''); const [slideImageFile, setSlideImageFile] = useState(null); const [slideImageUrl, setSlideImageUrl] = useState('');
  const [partners, setPartners] = useState([]); const [editPartnerId, setEditPartnerId] = useState(null); const [partnerName, setPartnerName] = useState(''); const [partnerImgFile, setPartnerImgFile] = useState(null); const [partnerField, setPartnerField] = useState(''); const [partnerImgUrl, setPartnerImgUrl] = useState('');
  const [services, setServices] = useState([]); const [editServiceId, setEditServiceId] = useState(null); const [serviceName, setServiceName] = useState(''); const [serviceDesc, setServiceDesc] = useState(''); const [serviceLink, setServiceLink] = useState(''); const [serviceImgFile, setServiceImgFile] = useState(null); const [serviceImgUrl, setServiceImgUrl] = useState('');
  const [subServices, setSubServices] = useState([]); const [editSubServiceId, setEditSubServiceId] = useState(null); const [subParentId, setSubParentId] = useState(''); const [subTitle, setSubTitle] = useState(''); const [subDesc, setSubDesc] = useState(''); const [subImgFile, setSubImgFile] = useState(null); const [subImgUrl, setSubImgUrl] = useState('');
  const [teams, setTeams] = useState([]); const [editTeamId, setEditTeamId] = useState(null); const [teamName, setTeamName] = useState(''); const [teamRole, setTeamRole] = useState(''); const [teamImgFile, setTeamImgFile] = useState(null); const [teamImgUrl, setTeamImgUrl] = useState('');
  const [testimonials, setTestimonials] = useState([]); const [editTestiId, setEditTestiId] = useState(null); const [testiName, setTestiName] = useState(''); const [testiCompany, setTestiCompany] = useState(''); const [testiText, setTestiText] = useState('');
  const [faqs, setFaqs] = useState([]); const [editFaqId, setEditFaqId] = useState(null); const [faqQ, setFaqQ] = useState(''); const [faqA, setFaqA] = useState('');
  const [posts, setPosts] = useState([]); const [editPostId, setEditPostId] = useState(null); const [postTitle, setPostTitle] = useState(''); const [postContent, setPostContent] = useState(''); const [postCategory, setPostCategory] = useState('News'); const [postCoverUrl, setPostCoverUrl] = useState(''); const [postDateline, setPostDateline] = useState(''); const [postAuthor, setPostAuthor] = useState(''); const [postTags, setPostTags] = useState(''); const [isDraft, setIsDraft] = useState(false);
  const [events, setEvents] = useState([]); const [editEventsId, setEditEventsId] = useState(null); const [eventsName, setEventsName] = useState(''); const [eventsDate, setEventsDate] = useState(''); const [eventsLocation, setEventsLocation] = useState(''); const [eventsDesc, setEventsDesc] = useState(''); const [eventsImgFile, setEventsImgFile] = useState(null); const [eventsImgUrl, setEventsImgUrl] = useState('');

  // --- STATE BARU: PRODUK & PORTOFOLIO ---
  const [products, setProducts] = useState([]);
  const [editProductId, setEditProductId] = useState(null);
  const [productName, setProductName] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productBtnText, setProductBtnText] = useState('');
  const [productBtnLink, setProductBtnLink] = useState('');
  const [productImgFile, setProductImgFile] = useState(null);
  const [productImgUrl, setProductImgUrl] = useState('');

  // --- STATE HIERARKI ISO BARU ---
  const [isoTypes, setIsoTypes] = useState([]);
  const [isoFolders, setIsoFolders] = useState([]);
  const [docMasters, setDocMasters] = useState([]); 
  const [clients, setClients] = useState([]); 
  
  // State Form ISO & Folder
  const [newIsoName, setNewIsoName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedIsoForFolder, setSelectedIsoForFolder] = useState('');
  
  // State Form Dokumen
  const [newDocMasterName, setNewDocMasterName] = useState('');
  const [selectedFolderForDoc, setSelectedFolderForDoc] = useState('');

  // STATE REVIEW DOKUMEN KLIEN
  const [selectedClient, setSelectedClient] = useState(null); 
  const [selectedClientDocs, setSelectedClientDocs] = useState([]); 
  const [docComments, setDocComments] = useState({}); 

  // STATE BUAT KLIEN BARU OLEH ADMIN
  const [newClientLembaga, setNewClientLembaga] = useState('');
  const [newClientPic, setNewClientPic] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [selectedIsoForClient, setSelectedIsoForClient] = useState('');
  const [selectedFoldersForClient, setSelectedFoldersForClient] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setAuthLoading(false); });
    getDoc(doc(db, "settings", "general")).then(snap => { if(snap.exists()) setSettings(snap.data()); });
    
    // Load All Data
    const unsubSliders = onSnapshot(query(collection(db, "sliders"), orderBy("createdAt", "desc")), snap => setSliders(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => setPartners(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubServices = onSnapshot(query(collection(db, "services"), orderBy("createdAt", "desc")), snap => setServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubSubServices = onSnapshot(query(collection(db, "subservices"), orderBy("createdAt", "desc")), snap => setSubServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "asc")), snap => setTeams(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubTestimonials = onSnapshot(query(collection(db, "testimonials"), orderBy("createdAt", "desc")), snap => setTestimonials(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubFaqs = onSnapshot(query(collection(db, "faqs"), orderBy("createdAt", "asc")), snap => setFaqs(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => setPosts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubEvents = onSnapshot(query(collection(db, "events"), orderBy("createdAt", "desc")), snap => setEvents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), snap => setProducts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    // FETCH DATA PORTAL ISO BARU (HIERARKI)
    const unsubIsoTypes = onSnapshot(query(collection(db, "iso_types"), orderBy("createdAt", "asc")), snap => setIsoTypes(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubIsoFolders = onSnapshot(query(collection(db, "iso_folders"), orderBy("createdAt", "asc")), snap => setIsoFolders(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubDocMasters = onSnapshot(query(collection(db, "doc_masters"), orderBy("createdAt", "asc")), snap => setDocMasters(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubClients = onSnapshot(query(collection(db, "clients"), orderBy("createdAt", "desc")), snap => setClients(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubscribeAuth(); unsubSliders(); unsubPartners(); unsubServices(); unsubSubServices(); unsubTeams(); unsubTestimonials(); unsubFaqs(); unsubPosts(); unsubEvents(); unsubProducts(); unsubClients(); unsubDocMasters(); unsubIsoTypes(); unsubIsoFolders(); };
  }, []);

  // Mengambil dokumen dari klien yang di-klik
  useEffect(() => {
      if (selectedClient) {
          const q = query(collection(db, "client_docs"), where("clientId", "==", selectedClient.id));
          const unsubSelectedDocs = onSnapshot(q, snap => {
              setSelectedClientDocs(snap.docs.map(d => ({id: d.id, ...d.data()})));
          });
          return () => unsubSelectedDocs();
      }
  }, [selectedClient]);

  const handleLogin = async (e) => { e.preventDefault(); setLoading(true); try { await signInWithEmailAndPassword(auth, email, password); alert("Login Berhasil!"); } catch (err) { alert("Email/Password salah!"); } setLoading(false); };
  const handleLogout = async () => { await signOut(auth); alert("Logout Berhasil"); };
  const saveSettings = async (e) => { e.preventDefault(); setLoading(true); try { await setDoc(doc(db, "settings", "general"), settings, { merge: true }); alert("Tersimpan!"); } catch(err) { alert(err.message); } setLoading(false); };
  
  const cancelAllEdits = () => { cancelEditSlider(); cancelEditPartner(); cancelEditService(); cancelEditSub(); cancelEditTeam(); cancelEditTesti(); cancelEditFaq(); cancelEditPost(); cancelEditEvents(); cancelEditProduct(); setSelectedClient(null); };
  const switchTab = (tabId) => { setActiveTab(tabId); setIsSidebarOpen(false); cancelAllEdits(); };
  const deleteItem = async (col, id) => { if(confirm(`Hapus data ini permanen?`)) await deleteDoc(doc(db, col, id)); };

  const cancelEditSlider = () => { setEditSliderId(null); setSlideTagline(''); setSlideTitle(''); setSlideSubtitle(''); setSlideBtn1Text(''); setSlideBtn1Link(''); setSlideBtn2Text(''); setSlideBtn2Link(''); setSlideImageUrl(''); setSlideImageFile(null); };
  const handleEditSlider = (s) => { setEditSliderId(s.id); setSlideTagline(s.tagline || ''); setSlideTitle(s.title || ''); setSlideSubtitle(s.subtitle || ''); setSlideBtn1Text(s.btn1Text || s.btnText || ''); setSlideBtn1Link(s.btn1Link || s.btnLink || ''); setSlideBtn2Text(s.btn2Text || ''); setSlideBtn2Link(s.btn2Link || ''); setSlideImageUrl(s.imageUrl || ''); setSlideImageFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveSlider = async (e) => { e.preventDefault(); setLoading(true); try { let finalImg = slideImageUrl; if (slideImageFile) finalImg = await uploadToCloudinary(slideImageFile); if (!finalImg && !editSliderId) { alert("Pilih gambar!"); setLoading(false); return; } const data = { tagline: slideTagline, title: slideTitle, subtitle: slideSubtitle, btn1Text: slideBtn1Text, btn1Link: slideBtn1Link, btn2Text: slideBtn2Text, btn2Link: slideBtn2Link, imageUrl: finalImg }; if (editSliderId) await updateDoc(doc(db, "sliders", editSliderId), data); else await addDoc(collection(db, "sliders"), { ...data, createdAt: serverTimestamp() }); alert("Berhasil!"); cancelEditSlider(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditPartner = () => { setEditPartnerId(null); setPartnerName(''); setPartnerField(''); setPartnerImgUrl(''); setPartnerImgFile(null); if(document.getElementById('partnerFileInput')) document.getElementById('partnerFileInput').value = ''; };
  const handleEditPartner = (p) => { setEditPartnerId(p.id); setPartnerName(p.name||''); setPartnerField(p.field||''); setPartnerImgUrl(p.imgUrl||''); setPartnerImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const savePartner = async (e) => { e.preventDefault(); setLoading(true); try { let finalImg = partnerImgUrl; if (partnerImgFile) finalImg = await uploadToCloudinary(partnerImgFile); const data = { name: partnerName, imgUrl: finalImg, field: partnerField }; if (editPartnerId) await updateDoc(doc(db, "partners", editPartnerId), data); else await addDoc(collection(db, "partners"), { ...data, createdAt: serverTimestamp() }); alert("Berhasil!"); cancelEditPartner(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditService = () => { setEditServiceId(null); setServiceName(''); setServiceDesc(''); setServiceLink(''); setServiceImgUrl(''); setServiceImgFile(null); };
  const handleEditService = (s) => { setEditServiceId(s.id); setServiceName(s.name||''); setServiceDesc(s.desc||''); setServiceLink(s.link||''); setServiceImgUrl(s.imgUrl||''); setServiceImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveService = async (e) => { e.preventDefault(); setLoading(true); try { let finalImg = serviceImgUrl; if (serviceImgFile) finalImg = await uploadToCloudinary(serviceImgFile); const data = { name: serviceName, desc: serviceDesc, link: serviceLink || "#", imgUrl: finalImg }; if (editServiceId) await updateDoc(doc(db, "services", editServiceId), data); else await addDoc(collection(db, "services"), { ...data, createdAt: serverTimestamp() }); alert('Berhasil!'); cancelEditService(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditSub = () => { setEditSubServiceId(null); setSubParentId(''); setSubTitle(''); setSubDesc(''); setSubImgUrl(''); setSubImgFile(null); };
  const handleEditSub = (s) => { setEditSubServiceId(s.id); setSubParentId(s.parentId||''); setSubTitle(s.title||''); setSubDesc(s.desc||''); setSubImgUrl(s.imgUrl||''); setSubImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveSubService = async (e) => { e.preventDefault(); if(!subParentId) return alert("Harap pilih Layanan Utama terlebih dahulu!"); setLoading(true); try { let finalImg = subImgUrl; if (subImgFile) finalImg = await uploadToCloudinary(subImgFile); const data = { parentId: subParentId, title: subTitle, desc: subDesc, imgUrl: finalImg }; if (editSubServiceId) await updateDoc(doc(db, "subservices", editSubServiceId), data); else await addDoc(collection(db, "subservices"), { ...data, createdAt: serverTimestamp() }); alert('Sub-Layanan Tersimpan!'); cancelEditSub(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditTeam = () => { setEditTeamId(null); setTeamName(''); setTeamRole(''); setTeamImgUrl(''); setTeamImgFile(null); };
  const handleEditTeam = (t) => { setEditTeamId(t.id); setTeamName(t.name||''); setTeamRole(t.role||''); setTeamImgUrl(t.img||''); setTeamImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveTeam = async (e) => { e.preventDefault(); setLoading(true); try { let finalImg = teamImgUrl; if (teamImgFile) finalImg = await uploadToCloudinary(teamImgFile); if (!finalImg && !editTeamId) { alert("Pilih foto!"); setLoading(false); return; } const data = { name: teamName, role: teamRole, img: finalImg }; if (editTeamId) await updateDoc(doc(db, "teams", editTeamId), data); else await addDoc(collection(db, "teams"), { ...data, createdAt: serverTimestamp() }); alert("Berhasil!"); cancelEditTeam(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditTesti = () => { setEditTestiId(null); setTestiName(''); setTestiCompany(''); setTestiText(''); };
  const handleEditTesti = (t) => { setEditTestiId(t.id); setTestiName(t.name||''); setTestiCompany(t.company||''); setTestiText(t.text||''); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveTestimonial = async (e) => { e.preventDefault(); setLoading(true); try { const data = { name: testiName, company: testiCompany, text: testiText }; if (editTestiId) await updateDoc(doc(db, "testimonials", editTestiId), data); else await addDoc(collection(db, "testimonials"), { ...data, createdAt: serverTimestamp() }); alert("Berhasil!"); cancelEditTesti(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditFaq = () => { setEditFaqId(null); setFaqQ(''); setFaqA(''); };
  const handleEditFaq = (f) => { setEditFaqId(f.id); setFaqQ(f.q||''); setFaqA(f.a||''); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveFaq = async (e) => { e.preventDefault(); setLoading(true); try { const data = { q: faqQ, a: faqA }; if (editFaqId) await updateDoc(doc(db, "faqs", editFaqId), data); else await addDoc(collection(db, "faqs"), { ...data, createdAt: serverTimestamp() }); alert("Berhasil!"); cancelEditFaq(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditPost = () => { setEditPostId(null); setPostTitle(''); setPostContent(''); setPostCoverUrl(''); setPostDateline(''); setPostAuthor(''); setPostTags(''); setIsDraft(false); };
  const handleEditPost = (post) => { setEditPostId(post.id); setPostTitle(post.title); setPostCategory(post.category); setPostContent(post.content); setPostCoverUrl(post.coverUrl || ''); setPostDateline(post.dateline || ''); setPostAuthor(post.author || ''); setPostTags(post.tags || ''); setIsDraft(post.isDraft || false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const savePost = async (e) => { e.preventDefault(); setLoading(true); try { if (editPostId) { await updateDoc(doc(db, "posts", editPostId), { title: postTitle, category: postCategory, content: postContent, coverUrl: postCoverUrl, dateline: postDateline, author: postAuthor || 'Tim Redaksi', tags: postTags, isDraft: isDraft }); alert(isDraft ? 'Draf Diperbarui!' : 'Berita Diperbarui!'); } else { let slug = postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''); if (!slug) slug = 'berita-' + Date.now(); const docSnap = await getDoc(doc(db, "posts", slug)); if (docSnap.exists()) slug = slug + '-' + Math.floor(Math.random() * 1000); await setDoc(doc(db, "posts", slug), { title: postTitle, category: postCategory, content: postContent, coverUrl: postCoverUrl, dateline: postDateline, author: postAuthor || 'Tim Redaksi', tags: postTags, views: 0, createdAt: serverTimestamp(), isDraft: isDraft }); alert(isDraft ? 'Draf Disimpan!' : 'Berita Diterbitkan!'); } cancelEditPost(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditEvents = () => { setEditEventsId(null); setEventsName(''); setEventsDate(''); setEventsLocation(''); setEventsDesc(''); setEventsImgUrl(''); setEventsImgFile(null); };
  const handleEditEvents = (e) => { setEditEventsId(e.id); setEventsName(e.name||''); setEventsDate(e.date||''); setEventsLocation(e.location||''); setEventsDesc(e.desc||''); setEventsImgUrl(e.imgUrl||''); setEventsImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveEvents = async (e) => { e.preventDefault(); setLoading(true); try { let finalImg = eventsImgUrl; if (eventsImgFile) finalImg = await uploadToCloudinary(eventsImgFile); const data = { name: eventsName, date: eventsDate, location: eventsLocation, desc: eventsDesc, imgUrl: finalImg }; if (editEventsId) await updateDoc(doc(db, "events", editEventsId), data); else await addDoc(collection(db, "events"), { ...data, createdAt: serverTimestamp() }); alert('Agenda/Events Berhasil Disimpan!'); cancelEditEvents(); } catch(err) { alert(err.message); } setLoading(false); };

  // --- FUNGSI PRODUK & PORTOFOLIO ---
  const cancelEditProduct = () => { setEditProductId(null); setProductName(''); setProductLabel(''); setProductDesc(''); setProductBtnText(''); setProductBtnLink(''); setProductImgUrl(''); setProductImgFile(null); };
  const handleEditProduct = (p) => { setEditProductId(p.id); setProductName(p.name||''); setProductLabel(p.label||''); setProductDesc(p.desc||''); setProductBtnText(p.btnText||''); setProductBtnLink(p.btnLink||''); setProductImgUrl(p.imgUrl||''); setProductImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveProduct = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
          let finalImg = productImgUrl;
          if (productImgFile) finalImg = await uploadToCloudinary(productImgFile);
          
          const data = { name: productName, label: productLabel, desc: productDesc, btnText: productBtnText, btnLink: productBtnLink, imgUrl: finalImg };
          
          if (editProductId) await updateDoc(doc(db, "products", editProductId), data);
          else await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
          
          alert('Data Berhasil Disimpan!'); cancelEditProduct();
      } catch(err) { alert(err.message); }
      setLoading(false);
  };

  // --- FUNGSI MASTER ISO (TAHAP BARU) ---
  const saveIsoType = async (e) => {
      e.preventDefault();
      if(!newIsoName) return;
      try {
          await addDoc(collection(db, "iso_types"), { name: newIsoName, createdAt: serverTimestamp() });
          setNewIsoName(''); alert("Jenis ISO berhasil ditambahkan!");
      } catch (err) { alert(err.message); }
  };

  const saveIsoFolder = async (e) => {
      e.preventDefault();
      if(!newFolderName || !selectedIsoForFolder) return alert("Pilih ISO dan isi nama folder!");
      try {
          await addDoc(collection(db, "iso_folders"), { isoId: selectedIsoForFolder, name: newFolderName, createdAt: serverTimestamp() });
          setNewFolderName(''); alert("Folder berhasil ditambahkan!");
      } catch (err) { alert(err.message); }
  };

  const saveDocMaster = async (e) => {
      e.preventDefault();
      if(!newDocMasterName || !selectedFolderForDoc) return alert("Pilih Folder dan isi nama dokumen!");
      try {
          await addDoc(collection(db, "doc_masters"), { folderId: selectedFolderForDoc, name: newDocMasterName, createdAt: serverTimestamp() });
          setNewDocMasterName(''); alert("Syarat Dokumen berhasil ditambahkan!");
      } catch (err) { alert(err.message); }
  };

  // --- FUNGSI DUPLIKAT & RENAME FOLDER ---
  const handleRenameFolder = async (folderId, oldName) => {
      const newName = prompt("Masukkan nama folder baru:", oldName);
      if (newName && newName.trim() !== "" && newName !== oldName) {
          try {
              await updateDoc(doc(db, "iso_folders", folderId), { name: newName });
              alert("Nama folder berhasil diubah!");
          } catch(err) { alert(err.message); }
      }
  };

  const handleDuplicateFolder = async (folder) => {
      const newName = prompt(`Duplikat folder "${folder.name}". Masukkan nama folder baru:`, `${folder.name} (Copy)`);
      if (!newName || newName.trim() === "") return;

      setLoading(true);
      try {
          // 1. Buat folder baru dengan nama yang baru diisi
          const newFolderRef = await addDoc(collection(db, "iso_folders"), {
              isoId: folder.isoId,
              name: newName,
              createdAt: serverTimestamp()
          });

          // 2. Ambil dokumen dari folder lama
          const docsToCopy = docMasters.filter(d => d.folderId === folder.id);

          // 3. Duplikat dokumen-dokumen tersebut dan masukkan ke folder baru
          for (const docItem of docsToCopy) {
              await addDoc(collection(db, "doc_masters"), {
                  folderId: newFolderRef.id,
                  name: docItem.name,
                  createdAt: serverTimestamp()
              });
          }
          alert(`Folder "${newName}" berhasil diduplikat beserta ${docsToCopy.length} Syarat Dokumen di dalamnya!`);
      } catch(err) {
          alert("Gagal menduplikat folder: " + err.message);
      }
      setLoading(false);
  };

  // --- FUNGSI BUAT & REVIEW KLIEN ---
  const toggleFolderForClient = (folderId) => {
      setSelectedFoldersForClient(prev => 
          prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
      );
  };

  const handleCreateClient = async (e) => {
      e.preventDefault();
      if(selectedFoldersForClient.length === 0) return alert("Pilih minimal 1 folder kebutuhan klien!");
      setLoading(true);
      try {
          const q = query(collection(db, "clients"), where("email", "==", newClientEmail));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) { alert("Email sudah digunakan klien lain!"); setLoading(false); return; }
          
          await addDoc(collection(db, "clients"), {
              lembagaName: newClientLembaga,
              picName: newClientPic,
              phone: newClientPhone,
              email: newClientEmail,
              password: newClientPassword,
              isoId: selectedIsoForClient,
              assignedFolders: selectedFoldersForClient,
              status: 'approved',
              createdAt: serverTimestamp()
          });

          alert("Akun Klien berhasil dibuat!");
          setNewClientLembaga(''); setNewClientPic(''); setNewClientPhone(''); setNewClientEmail(''); setNewClientPassword('');
          setSelectedIsoForClient(''); setSelectedFoldersForClient([]);
      } catch (err) { alert("Gagal membuat akun: " + err.message); }
      setLoading(false);
  };

  const handleReviewDoc = async (clientDocId, status) => {
      const comment = docComments[clientDocId] || '';
      if (status === 'revision' && !comment.trim()) return alert("Wajib mengisi komentar revisi!");
      if(!confirm(`Apakah Anda yakin mengubah dokumen ini menjadi ${status.toUpperCase()}?`)) return;

      try {
          await updateDoc(doc(db, "client_docs", clientDocId), {
              status: status, 
              adminComment: status === 'approved' ? 'Dokumen Sesuai' : comment,
              updatedAt: serverTimestamp()
          });
          alert(`Dokumen berhasil di-${status === 'approved' ? 'ACC' : 'REVISI'}!`);
      } catch (err) { alert("Gagal menyimpan review: " + err.message); }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><p className="animate-pulse font-bold tracking-widest">MENGECEK OTORITAS...</p></div>;
  if (!user) return (<div className="min-h-screen flex items-center justify-center bg-slate-900 p-4"><form onSubmit={handleLogin} className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md"><h1 className="text-2xl font-black text-slate-900 mb-2">Admin Login</h1><div className="space-y-4 mt-6"><div><label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email</label><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border-2 p-3 rounded-xl focus:border-orange-500 outline-none" /></div><div><label className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</label><input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border-2 p-3 rounded-xl focus:border-orange-500 outline-none" /></div><button disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition">{loading ? 'Loading...' : 'MASUK'}</button></div></form></div>);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      <div className="md:hidden absolute top-0 left-0 w-full bg-slate-950 text-white p-4 flex justify-between items-center z-20 shadow-md"><h1 className="text-sm font-black text-orange-500 tracking-widest uppercase">Admin Panel</h1><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="focus:outline-none bg-slate-800 p-2 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg></button></div>
      {isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-20" onClick={() => setIsSidebarOpen(false)}></div>}
      
      {/* SIDEBAR */}
      <aside className={`fixed md:relative top-0 left-0 w-64 h-full bg-slate-900 text-slate-300 flex flex-col shadow-xl z-30 transition-transform duration-300 border-r border-slate-800 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5 border-b border-slate-800 bg-slate-950 mt-14 md:mt-0 flex justify-between items-center"><div><h1 className="text-lg font-black text-orange-500 tracking-widest uppercase hidden md:block">Admin Panel</h1><p className="text-[10px] font-bold text-slate-500 mt-1 tracking-widest truncate">{user.email}</p></div><button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            
            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-500 mb-2 px-2">Sistem Portal ISO</p>
                <nav className="space-y-1">
                    {[
                        { id: 'clients', label: 'Kelola Akun Klien' }, 
                        { id: 'docmasters', label: 'Master ISO & Folder' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => switchTab(tab.id)} className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>

            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 px-2">Konten Utama</p>
                <nav className="space-y-1">
                    {[
                        { id: 'blog', label: 'Wawasan (Blog)' }, 
                        { id: 'events', label: 'Jadwal / Events' }, 
                        { id: 'layanan', label: 'Kelola Layanan' }, 
                        { id: 'sublayanan', label: 'Sub-Layanan' }, 
                        { id: 'mitra', label: 'Mitra & Klien' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => switchTab(tab.id)} className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>
            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 px-2">Halaman Depan</p>
                <nav className="space-y-1">
                    {[
                        { id: 'umum', label: 'Teks & Logo Utama' }, 
                        { id: 'tentang', label: 'Halaman Tentang Kami' }, 
                        { id: 'slider', label: 'Hero Slider' }, 
                        { id: 'products', label: 'Produk & Portofolio' }, 
                        { id: 'tim', label: 'Tim Pakar' }, 
                        { id: 'testimoni', label: 'Testimoni' }, 
                        { id: 'faq', label: 'F.A.Q' }, 
                        { id: 'footer', label: 'Pengaturan Footer' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => switchTab(tab.id)} className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2 pb-6 md:pb-4"><Link href="/" target="_blank" className="flex-1 text-center py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold transition">WEB ↗</Link><button onClick={handleLogout} className="flex-1 py-2.5 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white rounded text-[10px] font-bold transition">LOGOUT</button></div>
      </aside>

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-full bg-slate-50">
        <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">
                {activeTab === 'blog' ? 'Kelola Wawasan (Blog)' : activeTab === 'clients' ? 'Kelola Akun Klien ISO' : activeTab === 'docmasters' ? 'Hierarki Dokumen ISO' : activeTab === 'products' ? 'Produk & Portofolio' : `Kelola ${activeTab}`}
            </h2>
        </div>
        
        {/* --- TAB KELOLA KLIEN (BUAT AKUN & REVIEW) --- */}
        {activeTab === 'clients' && (
            <div className="max-w-6xl">
                {!selectedClient ? (
                    <>
                        {/* FORM BUAT AKUN KLIEN OLEH ADMIN */}
                        <form onSubmit={handleCreateClient} className="bg-white p-6 rounded-2xl shadow-sm border mb-8 border-emerald-100">
                            <h3 className="font-bold text-lg mb-2 text-emerald-700">Daftarkan Klien Baru</h3>
                            <p className="text-xs text-slate-500 mb-6">Akun yang dibuat di sini bisa langsung digunakan oleh klien untuk login ke Portal ISO.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Nama Lembaga</label>
                                    <input type="text" required value={newClientLembaga} onChange={e=>setNewClientLembaga(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50" placeholder="Cth: PT Sukses Bersama" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Nama PIC</label>
                                    <input type="text" required value={newClientPic} onChange={e=>setNewClientPic(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50" placeholder="Nama Lengkap Penanggung Jawab" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">No WhatsApp</label>
                                    <input type="text" required value={newClientPhone} onChange={e=>setNewClientPhone(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50" placeholder="0812..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Email Login</label>
                                    <input type="email" required value={newClientEmail} onChange={e=>setNewClientEmail(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50" placeholder="email@lembaga.com" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Password Login</label>
                                    <input type="text" required value={newClientPassword} onChange={e=>setNewClientPassword(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50" placeholder="Buat password untuk klien..." />
                                </div>
                            </div>

                            {/* PILIH KEBUTUHAN ISO & FOLDER KLIEN */}
                            <div className="border-t border-slate-100 pt-4 mt-2">
                                <h4 className="font-bold text-sm mb-3">Tentukan Kebutuhan Dokumen Klien</h4>
                                <select 
                                    className="w-full md:w-1/2 border p-2.5 rounded-lg text-sm bg-slate-50 mb-4"
                                    value={selectedIsoForClient} 
                                    onChange={(e) => { setSelectedIsoForClient(e.target.value); setSelectedFoldersForClient([]); }}
                                >
                                    <option value="">-- Pilih Jenis Sertifikasi ISO --</option>
                                    {isoTypes.map(iso => <option key={iso.id} value={iso.id}>{iso.name}</option>)}
                                </select>

                                {selectedIsoForClient && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Pilih Folder Kebutuhan untuk Klien Ini:</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {isoFolders.filter(f => f.isoId === selectedIsoForClient).map(folder => (
                                                <label key={folder.id} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border shadow-sm">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFoldersForClient.includes(folder.id)}
                                                        onChange={() => toggleFolderForClient(folder.id)}
                                                        className="w-4 h-4 text-emerald-600"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700 line-clamp-1">{folder.name}</span>
                                                </label>
                                            ))}
                                            {isoFolders.filter(f => f.isoId === selectedIsoForClient).length === 0 && <p className="text-xs text-slate-400">Belum ada folder di ISO ini.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-sm w-full md:w-auto hover:bg-emerald-700 transition mt-6 shadow-md">
                                {loading ? 'Memproses...' : 'Simpan & Buat Akun Klien'}
                            </button>
                        </form>

                        {/* TABEL DAFTAR KLIEN YANG SUDAH DIBUAT */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
                            <h3 className="font-bold text-lg mb-4">Daftar Akun Klien</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                                            <th className="p-3 border-b">Nama Lembaga</th>
                                            <th className="p-3 border-b">ISO & Folder</th>
                                            <th className="p-3 border-b">Email / User</th>
                                            <th className="p-3 border-b text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.length === 0 ? (
                                            <tr><td colSpan="4" className="p-4 text-center text-slate-400">Belum ada akun klien yang dibuat.</td></tr>
                                        ) : clients.map(c => {
                                            const isoName = isoTypes.find(i => i.id === c.isoId)?.name || 'Unknown ISO';
                                            return (
                                                <tr key={c.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                                                    <td className="p-3 font-bold text-sm text-emerald-700">
                                                        {c.lembagaName}
                                                        <div className="text-[10px] font-normal text-slate-500 mt-1">PIC: {c.picName} ({c.phone})</div>
                                                    </td>
                                                    <td className="p-3 text-xs">
                                                        <div className="font-bold text-slate-800">{isoName}</div>
                                                        <div className="text-[10px] text-slate-500 mt-1">{c.assignedFolders?.length || 0} Folder Ditugaskan</div>
                                                    </td>
                                                    <td className="p-3 text-xs text-slate-600">{c.email}</td>
                                                    <td className="p-3 text-right space-x-2">
                                                        <button onClick={() => setSelectedClient(c)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-xs font-bold transition border border-indigo-200 shadow-sm">
                                                            🔍 Cek Dokumen
                                                        </button>
                                                        <button onClick={() => deleteItem('clients', c.id)} className="px-3 py-1.5 text-slate-400 hover:text-red-600 text-xs font-bold transition">Hapus</button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    // TAMPILAN 2: REVIEW DOKUMEN SPESIFIK 1 KLIEN
                    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-lg border border-slate-200 mb-8 animate-in fade-in zoom-in duration-300">
                        <button onClick={() => setSelectedClient(null)} className="mb-6 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 transition">
                            ← Kembali ke Daftar Klien
                        </button>
                        
                        <div className="border-b border-slate-200 pb-4 mb-6">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Ruang Review Audit</p>
                            <h3 className="font-black text-2xl md:text-3xl text-slate-900">{selectedClient.lembagaName}</h3>
                            <p className="text-sm text-slate-500 mt-1">ISO: <b>{isoTypes.find(i => i.id === selectedClient.isoId)?.name}</b></p>
                        </div>

                        <div className="space-y-6">
                            {/* Render folder-folder yang ditugaskan ke klien ini */}
                            {selectedClient.assignedFolders?.map(folderId => {
                                const folder = isoFolders.find(f => f.id === folderId);
                                const docsInFolder = docMasters.filter(d => d.folderId === folderId);
                                if (!folder) return null;

                                return (
                                    <div key={folder.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-slate-50 p-4 border-b border-slate-200">
                                            <h4 className="font-bold text-slate-800">📁 {folder.name}</h4>
                                        </div>
                                        <div className="p-4 space-y-4 bg-white">
                                            
                                            {/* AWAL BLOK YANG DIUBAH */}
                                            {docsInFolder.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">Belum ada dokumen di folder ini.</p>
                                            ) : docsInFolder.map((master, idx) => {
                                                const cDoc = selectedClientDocs.find(d => d.masterId === master.id);
                                                
                                                // Logika aman untuk membaca Array Files (Multiple Upload) atau File Lama (Single Upload)
                                                let currentFiles = cDoc?.files || [];
                                                if (cDoc?.fileUrl && currentFiles.length === 0) {
                                                    currentFiles = [{ url: cDoc.fileUrl, name: 'Dokumen_Lama.pdf' }];
                                                }

                                                return (
                                                    <div key={master.id} className={`p-4 border rounded-xl flex flex-col gap-4 justify-between transition-colors ${cDoc?.status === 'approved' ? 'bg-emerald-50/50 border-emerald-200' : cDoc?.status === 'revision' ? 'bg-red-50/50 border-red-200' : 'bg-slate-50'}`}>
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex justify-center items-center text-[10px] font-bold shrink-0">{idx + 1}</span>
                                                                <h4 className="font-bold text-sm text-slate-800">{master.name}</h4>
                                                                
                                                                {/* Badge Status */}
                                                                {cDoc ? (
                                                                    <div className="ml-2 flex gap-2">
                                                                        {cDoc.status === 'pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase border border-yellow-200 animate-pulse">Menunggu Cek</span>}
                                                                        {cDoc.status === 'approved' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase border border-emerald-200">✅ Disetujui</span>}
                                                                        {cDoc.status === 'revision' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase border border-red-200">❌ Direvisi</span>}
                                                                    </div>
                                                                ) : (
                                                                    <span className="px-2 py-1 ml-2 bg-slate-200 text-slate-500 rounded text-[10px] font-bold uppercase">Belum Upload</span>
                                                                )}
                                                            </div>
                                                            
                                                            {/* List File Terlampir (Bisa Banyak) */}
                                                            <div className="ml-7 mt-3">
                                                                {currentFiles.length > 0 ? (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                        {currentFiles.map((f, i) => (
                                                                            <a key={i} href={f.url} target="_blank" className="text-xs px-3 py-2 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 rounded-lg font-bold transition flex items-center gap-2 shadow-sm truncate">
                                                                                📄 {f.name || `Lampiran ${i+1}`} ↗
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    cDoc && <p className="text-[10px] text-slate-400 italic">Tidak ada file terlampir.</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* FORM REVIEW ADMIN */}
                                                        {cDoc && (
                                                            <div className="w-full flex flex-col md:flex-row gap-2 border-t border-slate-200 pt-4 mt-2">
                                                                <input type="text" placeholder={cDoc.status === 'approved' ? "Dokumen ACC." : "Tulis revisi..."} value={docComments[cDoc.id] !== undefined ? docComments[cDoc.id] : (cDoc.adminComment || '')} onChange={(e) => setDocComments({...docComments, [cDoc.id]: e.target.value})} className="text-xs border p-2.5 rounded-lg flex-1 outline-none focus:border-indigo-500 bg-white" disabled={cDoc.status === 'approved'}/>
                                                                <div className="flex gap-2 w-full md:w-auto shrink-0">
                                                                    <button onClick={() => handleReviewDoc(cDoc.id, 'approved')} disabled={cDoc.status === 'approved'} className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-xs font-bold transition shadow-sm">ACC</button>
                                                                    <button onClick={() => handleReviewDoc(cDoc.id, 'revision')} disabled={cDoc.status === 'approved'} className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold transition">Revisi</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                            {/* AKHIR BLOK YANG DIUBAH */}

                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- TAB MASTER DOKUMEN & FOLDER (HIERARKI) --- */}
        {activeTab === 'docmasters' && (
            <div className="max-w-4xl space-y-8">
                
                {/* 1. BUAT JENIS ISO */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">1. Buat Jenis Sertifikasi ISO</h3>
                    <form onSubmit={saveIsoType} className="flex gap-3 mb-4">
                        <input type="text" placeholder="Cth: ISO 9001:2015" value={newIsoName} onChange={e=>setNewIsoName(e.target.value)} className="flex-1 border p-3 rounded-lg text-sm" required/>
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition">Tambah ISO</button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                        {isoTypes.map(iso => (
                            <span key={iso.id} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2">
                                {iso.name} <button onClick={() => deleteItem('iso_types', iso.id)} className="text-red-500 hover:text-red-700">✖</button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* 2. BUAT FOLDER KEBUTUHAN & DUPLIKAT FOLDER */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200">
                    <h3 className="font-bold text-lg mb-4 text-emerald-800 border-b pb-2">2. Kelola Folder Dokumen</h3>
                    <form onSubmit={saveIsoFolder} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <select value={selectedIsoForFolder} onChange={e=>setSelectedIsoForFolder(e.target.value)} className="border p-3 rounded-lg text-sm bg-slate-50" required>
                            <option value="">-- Pilih ISO --</option>
                            {isoTypes.map(iso => <option key={iso.id} value={iso.id}>{iso.name}</option>)}
                        </select>
                        <input type="text" placeholder="Nama Folder Baru (Cth: BPM)" value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} className="border p-3 rounded-lg text-sm" required/>
                        <button disabled={loading} className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-emerald-700 transition shadow-md">Buat Folder</button>
                    </form>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {isoFolders.map(folder => {
                            const isoName = isoTypes.find(i => i.id === folder.isoId)?.name;
                            const docCount = docMasters.filter(d => d.folderId === folder.id).length;
                            
                            return (
                                <div key={folder.id} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl relative flex flex-col justify-between">
                                    <div>
                                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1 line-clamp-1">{isoName}</p>
                                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">📁 {folder.name}</h4>
                                        <p className="text-[10px] text-slate-500 mt-1">{docCount} Dokumen</p>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-3 pt-2 border-t border-emerald-200/50">
                                        <button onClick={() => handleDuplicateFolder(folder)} title="Duplikat Folder beserta isinya" className="flex-1 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 text-[10px] font-bold py-1 rounded transition">Copy</button>
                                        <button onClick={() => handleRenameFolder(folder.id, folder.name)} title="Ganti Nama" className="flex-1 bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 text-[10px] font-bold py-1 rounded transition">Rename</button>
                                        <button onClick={() => deleteItem('iso_folders', folder.id)} title="Hapus" className="bg-white text-red-500 border border-red-200 hover:bg-red-50 text-[10px] font-bold px-2 py-1 rounded transition">✖</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 3. BUAT SYARAT DOKUMEN DALAM FOLDER */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-200">
                    <h3 className="font-bold text-lg mb-4 text-indigo-800 border-b pb-2">3. Buat Syarat Dokumen (Isi Folder)</h3>
                    <form onSubmit={saveDocMaster} className="space-y-3 mb-6">
                        <select value={selectedFolderForDoc} onChange={e=>setSelectedFolderForDoc(e.target.value)} className="w-full border p-3 rounded-lg text-sm bg-slate-50" required>
                            <option value="">-- Pilih Folder --</option>
                            {isoFolders.map(f => {
                                const isoName = isoTypes.find(i => i.id === f.isoId)?.name;
                                return <option key={f.id} value={f.id}>{f.name} ({isoName})</option>
                            })}
                        </select>
                        <input type="text" placeholder="Nama Dokumen (Cth: SK Pendirian)" value={newDocMasterName} onChange={e=>setNewDocMasterName(e.target.value)} className="w-full border p-3 rounded-lg font-bold text-sm" required/>
                        <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto hover:bg-indigo-700 transition shadow-md">Tambah Dokumen ke Folder</button>
                    </form>

                    <div className="space-y-4">
                        {isoFolders.map(folder => {
                            const docsInFolder = docMasters.filter(d => d.folderId === folder.id);
                            if (docsInFolder.length === 0) return null;
                            const isoName = isoTypes.find(i => i.id === folder.isoId)?.name;

                            return (
                                <div key={folder.id} className="border rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-indigo-50 p-3 flex justify-between items-center border-b border-indigo-100">
                                        <h4 className="font-bold text-indigo-900 text-sm">📁 {folder.name} <span className="text-[10px] bg-white px-2 py-0.5 rounded-full ml-2">{isoName}</span></h4>
                                    </div>
                                    <div className="p-3 bg-white space-y-2">
                                        {docsInFolder.map((doc, idx) => (
                                            <div key={doc.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg">
                                                <p className="text-sm font-semibold text-slate-700"><span className="text-slate-400 mr-2">{idx+1}.</span> {doc.name}</p>
                                                <button onClick={() => deleteItem('doc_masters', doc.id)} className="text-[10px] font-bold text-red-500 hover:underline">Hapus</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        )}

        {/* TAB PRODUK & PORTOFOLIO */}
        {activeTab === 'products' && (
            <div className="max-w-5xl">
                <form onSubmit={saveProduct} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                    {editProductId && (
                        <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                            <span>Sedang Mengedit Produk/Portofolio</span>
                            <button type="button" onClick={cancelEditProduct} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block mb-1">Upload Gambar / Cover</label>
                            <input type="file" onChange={e=>setProductImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />
                            {productImgUrl && !productImgFile && <img src={productImgUrl} className="h-32 mt-2 rounded-lg object-cover border" alt="Current" />}
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Judul / Nama Produk</label>
                            <input type="text" placeholder="Cth: Modul SOP ISO 9001" value={productName} onChange={e=>setProductName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Label Kategori (Opsional)</label>
                            <input type="text" placeholder="Cth: E-Book / Template / Project" value={productLabel} onChange={e=>setProductLabel(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
                            <textarea rows="3" placeholder="Jelaskan sedikit tentang produk/portofolio ini..." value={productDesc} onChange={e=>setProductDesc(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Teks Tombol Aksi</label>
                            <input type="text" placeholder="Cth: Beli Sekarang / Tanya Project" value={productBtnText} onChange={e=>setProductBtnText(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Link Tombol (Opsional)</label>
                            <input type="text" placeholder="Link Shopee, Web, dll. Kosongkan = Arah ke WhatsApp." value={productBtnLink} onChange={e=>setProductBtnLink(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" />
                        </div>
                    </div>
                    
                    <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-2">
                        {loading ? 'Memproses...' : (editProductId ? 'Perbarui Data' : 'Tambah ke Daftar')}
                    </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map(p => (
                        <div key={p.id} className={`bg-white p-4 rounded-xl border flex gap-4 items-start ${editProductId === p.id ? 'ring-2 ring-indigo-500' : ''}`}>
                            <img src={p.imgUrl || 'https://placehold.co/400x400?text=No+Image'} className="w-24 h-24 object-cover rounded-lg bg-slate-100" />
                            <div className="flex-1">
                                {p.label && <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-1 block">{p.label}</span>}
                                <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1">{p.name}</h4>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.desc}</p>
                                <div className="flex gap-2 mt-auto">
                                    <button onClick={() => handleEditProduct(p)} className="flex-1 text-indigo-600 text-[10px] font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition">Edit</button>
                                    <button onClick={()=>deleteItem('products', p.id)} className="flex-1 text-red-500 text-[10px] font-bold px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded transition">Hapus</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && <div className="col-span-1 md:col-span-2 text-center text-slate-400 py-10">Belum ada data produk/portofolio.</div>}
                </div>
            </div>
        )}

        {/* TAB UMUM */}
        {activeTab === 'umum' && (
            <form onSubmit={saveSettings} className="space-y-6 max-w-4xl bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-4 bg-slate-50 p-4 border rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-bold block mb-2 text-slate-700">Logo Mode Terang (Default)</label>
                        <div className="flex flex-col gap-2">
                            <input type="file" accept="image/*" onChange={async (e) => {
                                if(e.target.files[0]) {
                                    setLoading(true);
                                    try {
                                        const url = await uploadToCloudinary(e.target.files[0]);
                                        setSettings({...settings, logoUrl: url});
                                        alert(`Logo Terang Berhasil Diunggah!`);
                                    } catch(err) { alert(err.message); }
                                    setLoading(false);
                                }
                            }} className="text-xs border p-2 rounded bg-white w-full" />
                            {settings.logoUrl && <img src={settings.logoUrl} className="h-12 object-contain bg-white rounded border p-1 w-fit" alt="logo"/>}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">Muncul di latar putih.</p>
                    </div>

                    <div>
                        <label className="text-sm font-bold block mb-2 text-slate-700">Logo Mode Gelap (Opsional)</label>
                        <div className="flex flex-col gap-2">
                            <input type="file" accept="image/*" onChange={async (e) => {
                                if(e.target.files[0]) {
                                    setLoading(true);
                                    try {
                                        const url = await uploadToCloudinary(e.target.files[0]);
                                        setSettings({...settings, logoDarkUrl: url});
                                        alert(`Logo Gelap Berhasil Diunggah!`);
                                    } catch(err) { alert(err.message); }
                                    setLoading(false);
                                }
                            }} className="text-xs border p-2 rounded bg-white w-full" />
                            {settings.logoDarkUrl && <img src={settings.logoDarkUrl} className="h-12 object-contain bg-slate-900 rounded border p-1 w-fit" alt="logo dark"/>}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">Muncul otomatis saat mode gelap (latar hitam).</p>
                    </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Bagian: Our Mission</h3>
                    <div className="mb-4 bg-white p-3 border rounded-lg">
                        <label className="text-xs font-bold block mb-2 text-slate-700">Upload Gambar Utama Misi (Area Kiri)</label>
                        <input type="file" accept="image/*" onChange={async (e) => {
                            if(e.target.files[0]) {
                                setLoading(true);
                                try {
                                    const url = await uploadToCloudinary(e.target.files[0]);
                                    setSettings({...settings, missionImageUrl: url});
                                    alert(`Gambar Utama Misi Berhasil Diunggah!`);
                                } catch(err) { alert(err.message); }
                                setLoading(false);
                            }
                        }} className="text-[10px] border p-1 rounded w-full" />
                        {settings.missionImageUrl && <img src={settings.missionImageUrl} className="h-24 mt-2 object-cover rounded border p-1" alt="preview"/>}
                    </div>

                    <label className="text-xs font-bold block mb-1 text-slate-700">Judul Utama Misi (Area Kanan Atas)</label>
                    <input type="text" value={settings.missionTitle || ''} onChange={e=>setSettings({...settings, missionTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Contoh: Integrated Solution for Your Needs" />
                    <textarea value={settings.missionDesc || ''} onChange={e=>setSettings({...settings, missionDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg text-sm mb-4" rows="3" placeholder="Deskripsi Singkat Misi (Opsional)"></textarea>
                    
                    <h4 className="font-bold text-slate-700 mb-2 mt-6 text-sm border-t pt-4">Kartu Poin Misi (Area Kanan Bawah)</h4>
                    <p className="text-xs text-slate-500 mb-3">Isi paragraf panjang untuk setiap kartu misi. Biarkan kosong jika tidak digunakan.</p>
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3, 4].map(num => (
                            <div key={num} className="border border-slate-200 p-3 rounded-lg bg-white">
                                <label className="text-xs font-bold block mb-1 text-slate-600">Isi Kartu Misi {num}</label>
                                <textarea rows="3" placeholder={`Isi Poin Misi ${num} (Contoh: 1. Cultivating Leadership...)`} value={settings[`mission${num}Desc`] || ''} onChange={e=>setSettings({...settings, [`mission${num}Desc`]: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400" />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Bagian: Our Service</h3>
                    <input type="text" value={settings.serviceTitle || ''} onChange={e=>setSettings({...settings, serviceTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Judul Service" />
                    <textarea value={settings.serviceDesc || ''} onChange={e=>setSettings({...settings, serviceDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-4 text-sm" rows="3" placeholder="Deskripsi Service"></textarea>
                    <div className="border border-slate-200 p-3 md:p-4 rounded-lg bg-white"><label className="text-xs md:text-sm font-bold text-slate-700 block mb-2">Upload Gambar Ilustrasi Layanan</label><div className="flex flex-col md:flex-row items-center gap-3 md:gap-4"><input type="file" onChange={async (e) => { if(e.target.files[0]) { setLoading(true); try { const url = await uploadToCloudinary(e.target.files[0]); setSettings({...settings, serviceImageUrl: url}); alert("Gambar diunggah! Jangan lupa klik Simpan Pengaturan."); } catch(err) { alert(err.message); } setLoading(false); } }} accept="image/*" className="text-xs border p-2 rounded w-full" />{settings.serviceImageUrl && <img src={settings.serviceImageUrl} className="h-16 w-16 object-cover rounded border" alt="Preview"/>}</div></div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-red-600 border-b pb-2 text-sm md:text-base">Bagian: Call To Action (Siap Untuk Berubah?)</h3>
                    <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">Judul Call To Action</label>
                    <input type="text" value={settings.ctaTitle || ''} onChange={e=>setSettings({...settings, ctaTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Cth: Siap Untuk Berubah?" />
                    <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">Deskripsi</label>
                    <textarea value={settings.ctaDesc || ''} onChange={e=>setSettings({...settings, ctaDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" rows="3" placeholder="Deskripsi ajakan..."></textarea>
                    <label className="text-xs md:text-sm font-bold text-slate-700 block mt-2 mb-1">Link Tombol "Pesan Layanan"</label>
                    <input type="text" value={settings.ctaLink || ''} onChange={e=>setSettings({...settings, ctaLink: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="https://..." />
                </div>
                
                <button disabled={loading} className="bg-orange-600 text-white px-6 md:px-8 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Simpan Pengaturan</button>
            </form>
        )}

        {/* TAB TENTANG KAMI */}
        {activeTab === 'tentang' && (
            <div className="max-w-4xl bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold mb-6 text-indigo-600 text-lg border-b pb-2">Pengaturan Halaman Tentang Kami</h3>
                <form onSubmit={saveSettings} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold block mb-2 text-slate-700">Gambar Sampul (Hero Image)</label>
                        <input type="file" accept="image/*" onChange={async (e) => {
                            if(e.target.files[0]) {
                                setLoading(true);
                                try {
                                    const url = await uploadToCloudinary(e.target.files[0]);
                                    setSettings({...settings, aboutImageUrl: url});
                                    alert(`Gambar Sampul About Us Berhasil Diunggah!`);
                                } catch(err) { alert(err.message); }
                                setLoading(false);
                            }
                        }} className="text-xs border p-2 rounded w-full" />
                        {settings.aboutImageUrl && <img src={settings.aboutImageUrl} className="h-32 mt-2 object-cover rounded border" alt="about hero"/>}
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-1 text-slate-700">Judul Utama</label>
                        <input type="text" value={settings.aboutTitle || ''} onChange={e=>setSettings({...settings, aboutTitle: e.target.value})} className="w-full border p-3 rounded-lg text-sm" placeholder="Cth: Membangun Masa Depan yang Berkelanjutan." />
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-1 text-slate-700">Deskripsi Lengkap</label>
                        <textarea value={settings.aboutDesc || ''} onChange={e=>setSettings({...settings, aboutDesc: e.target.value})} className="w-full border p-3 rounded-lg text-sm" rows="6" placeholder="Tulis deskripsi lengkap tentang perusahaan..."></textarea>
                    </div>
                    <button disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Simpan Halaman Tentang Kami</button>
                </form>
            </div>
        )}

        {/* TAB FOOTER */}
        {activeTab === 'footer' && (
            <form onSubmit={saveSettings} className="space-y-6 max-w-4xl bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Profil & Kontak Footer</h3>
                    <label className="text-xs md:text-sm font-bold text-slate-700">Deskripsi Singkat</label>
                    <textarea value={settings.footerDesc || ''} onChange={e=>setSettings({...settings, footerDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-4 text-sm" rows="3"></textarea>
                    <label className="text-xs md:text-sm font-bold text-slate-700">Telepon / WhatsApp</label>
                    <input type="text" value={settings.phone || ''} onChange={e=>setSettings({...settings, phone: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" />
                    <label className="text-xs md:text-sm font-bold text-slate-700">Email Perusahaan</label>
                    <input type="email" value={settings.email || ''} onChange={e=>setSettings({...settings, email: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" />
                    <label className="text-xs md:text-sm font-bold text-slate-700">Alamat Lengkap</label>
                    <textarea value={settings.address || ''} onChange={e=>setSettings({...settings, address: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" rows="2"></textarea>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Lokasi & Maps</h3>
                    <div className="mb-4 bg-white p-3 border rounded-lg">
                        <label className="text-xs font-bold block mb-2 text-slate-700">Upload Gambar Peta/Lokasi</label>
                        <input type="file" accept="image/*" onChange={async (e) => {
                            if(e.target.files[0]) {
                                setLoading(true);
                                try {
                                    const url = await uploadToCloudinary(e.target.files[0]);
                                    setSettings({...settings, mapUrl: url});
                                    alert(`Gambar Peta Berhasil Diunggah!`);
                                } catch(err) { alert(err.message); }
                                setLoading(false);
                            }
                        }} className="text-xs border p-2 rounded w-full" />
                        {settings.mapUrl && <img src={settings.mapUrl} className="h-24 mt-2 object-cover rounded border p-1" alt="map preview"/>}
                    </div>
                    <label className="text-xs md:text-sm font-bold text-slate-700">Link Google Maps (Saat gambar diklik)</label>
                    <input type="text" value={settings.mapLink || ''} onChange={e=>setSettings({...settings, mapLink: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" placeholder="https://maps.google.com/..." />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border"><h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Media Sosial</h3>
                    <label className="text-xs md:text-sm font-bold text-slate-700">LinkedIn URL</label>
                    <input type="text" value={settings.linkedin || ''} onChange={e=>setSettings({...settings, linkedin: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" placeholder="https://linkedin.com/in/..." />
                    
                    <label className="text-xs md:text-sm font-bold text-slate-700">YouTube URL</label>
                    <input type="text" value={settings.youtube || ''} onChange={e=>setSettings({...settings, youtube: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" placeholder="https://youtube.com/..." />
                    
                    <label className="text-xs md:text-sm font-bold text-slate-700">Instagram URL</label>
                    <input type="text" value={settings.instagram || ''} onChange={e=>setSettings({...settings, instagram: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" placeholder="https://instagram.com/..." />
                </div>
                
                <button disabled={loading} className="bg-orange-600 text-white px-6 md:px-8 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Simpan Pengaturan Footer</button>
            </form>
        )}

        {/* TAB MITRA & KLIEN */}
        {activeTab === 'mitra' && (
            <div className="max-w-5xl">
                <form onSubmit={savePartner} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                    {editPartnerId && (
                        <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                            <span>Sedang Mengedit Mitra</span>
                            <button type="button" onClick={cancelEditPartner} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block mb-1">Logo Mitra</label>
                            <input type="file" id="partnerFileInput" onChange={e=>setPartnerImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />
                            {partnerImgUrl && !partnerImgFile && <img src={partnerImgUrl} className="h-16 mt-2 rounded object-contain border bg-white p-1" alt="Current Logo" />}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Nama Mitra / Klien</label>
                            <input type="text" value={partnerName} onChange={e=>setPartnerName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Bidang / Industri</label>
                            <input type="text" value={partnerField} onChange={e=>setPartnerField(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="Cth: Manufaktur" />
                        </div>
                    </div>
                    <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-2">
                        {loading ? 'Memproses...' : (editPartnerId ? 'Perbarui Data' : 'Tambah Mitra')}
                    </button>
                </form>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {partners.map(p => (
                        <div key={p.id} className="bg-white p-4 rounded-xl border flex flex-col items-center text-center shadow-sm">
                            <img src={p.imgUrl || 'https://placehold.co/100x100?text=No+Logo'} className="h-16 w-full object-contain mb-3" alt={p.name} />
                            <h4 className="font-bold text-sm text-slate-900 mb-1">{p.name}</h4>
                            <p className="text-[10px] text-slate-500 mb-3">{p.field}</p>
                            <div className="flex gap-2 w-full mt-auto">
                                <button onClick={() => handleEditPartner(p)} className="flex-1 text-indigo-600 text-[10px] font-bold py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition">Edit</button>
                                <button onClick={()=>deleteItem('partners', p.id)} className="flex-1 text-red-500 text-[10px] font-bold py-1.5 bg-red-50 hover:bg-red-100 rounded transition">Hapus</button>
                            </div>
                        </div>
                    ))}
                    {partners.length === 0 && <div className="col-span-2 md:col-span-4 text-center text-slate-400 py-10 border-2 border-dashed rounded-xl">Belum ada data mitra/klien.</div>}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}