import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Mail, Shield, Calendar, Edit3, Save, Camera, Store, UserCircle, MapPin, Phone, Facebook, Instagram, Twitter, Globe, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function Profile() {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bannerURL, setBannerURL] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    twitter: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setPhone(profile.phone || '');
      setPhotoURL(profile.photoURL || '');
      setBannerURL(profile.bannerURL || '');
      setSocialLinks({
        facebook: profile.socialLinks?.facebook || '',
        instagram: profile.socialLinks?.instagram || '',
        twitter: profile.socialLinks?.twitter || ''
      });
    }
  }, [profile]);

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        bio,
        location,
        phone,
        photoURL,
        bannerURL,
        socialLinks,
        updatedAt: new Date().toISOString()
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="animate-pulse p-20 bg-gray-50 rounded-3xl max-w-3xl mx-auto mt-20 h-[400px]" />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 overflow-hidden">
        {/* Header/Cover */}
        <div className="h-64 bg-gray-100 relative group">
          {profile.bannerURL ? (
            <img src={profile.bannerURL} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600" />
          )}
          
          {isEditing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl w-full max-w-xs">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">URL de la bannière</label>
                <input 
                  type="text" 
                  value={bannerURL}
                  onChange={(e) => setBannerURL(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
          )}

          <div className="absolute -bottom-16 left-12">
            <div className="w-40 h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl">
              <div className="w-full h-full rounded-[2rem] bg-gray-100 flex items-center justify-center overflow-hidden relative group">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gray-300" />
                )}
                
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
                    <Camera className="text-white w-6 h-6 mb-2" />
                    <input 
                      type="text" 
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      className="w-full px-2 py-1 bg-white/90 rounded-lg text-[10px] outline-none"
                      placeholder="URL Photo"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-24 pb-12 px-12">
          <div className="flex justify-between items-start mb-12">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="text-4xl font-black text-gray-900 tracking-tight border-b-2 border-indigo-600 outline-none w-full max-w-md"
                    placeholder="Votre nom d'affichage"
                  />
                ) : (
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                    {profile.displayName}
                  </h1>
                )}
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${profile.role === 'seller' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {profile.role === 'seller' ? <Store className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />}
                  {profile.role}
                </span>
                {profile.isVerified && (
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Vérifié
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-6 text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <input 
                      type="text" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="border-b border-gray-200 outline-none text-sm"
                      placeholder="Ville, Pays"
                    />
                  </div>
                ) : profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border-b border-gray-200 outline-none text-sm"
                      placeholder="Téléphone"
                    />
                  </div>
                ) : profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {profile.phone}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              {isEditing && (
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
              <button 
                onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
                disabled={loading}
                className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl ${isEditing ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-white text-gray-900 border border-gray-100 hover:bg-gray-50 shadow-gray-500/5'}`}
              >
                {isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                {isEditing ? (loading ? 'Enregistrement...' : 'Enregistrer') : 'Modifier le profil'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-12">
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">À propos de moi</h3>
                {isEditing ? (
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-6 outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[160px] font-medium text-gray-700"
                    placeholder="Partagez votre histoire, vos passions ou vos services..."
                  />
                ) : (
                  <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100">
                    <p className="text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                      {profile.bio || "Cet utilisateur n'a pas encore rédigé sa biographie."}
                    </p>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Réseaux Sociaux</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-6 bg-white border border-gray-100 rounded-3xl flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-blue-600">
                      <Facebook className="w-5 h-5" />
                      <span className="font-bold text-sm">Facebook</span>
                    </div>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={socialLinks.facebook}
                        onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})}
                        className="text-xs border-b border-gray-100 outline-none py-1"
                        placeholder="Lien profil"
                      />
                    ) : (
                      <a href={profile.socialLinks?.facebook} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-indigo-600 truncate">
                        {profile.socialLinks?.facebook || "Non renseigné"}
                      </a>
                    )}
                  </div>
                  <div className="p-6 bg-white border border-gray-100 rounded-3xl flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-pink-600">
                      <Instagram className="w-5 h-5" />
                      <span className="font-bold text-sm">Instagram</span>
                    </div>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={socialLinks.instagram}
                        onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                        className="text-xs border-b border-gray-100 outline-none py-1"
                        placeholder="Lien profil"
                      />
                    ) : (
                      <a href={profile.socialLinks?.instagram} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-indigo-600 truncate">
                        {profile.socialLinks?.instagram || "Non renseigné"}
                      </a>
                    )}
                  </div>
                  <div className="p-6 bg-white border border-gray-100 rounded-3xl flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-sky-500">
                      <Twitter className="w-5 h-5" />
                      <span className="font-bold text-sm">Twitter</span>
                    </div>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={socialLinks.twitter}
                        onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                        className="text-xs border-b border-gray-100 outline-none py-1"
                        placeholder="Lien profil"
                      />
                    ) : (
                      <a href={profile.socialLinks?.twitter} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-indigo-600 truncate">
                        {profile.socialLinks?.twitter || "Non renseigné"}
                      </a>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-500/5">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Activité</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-gray-600">Inscrit le</span>
                    </div>
                    <span className="text-sm font-black text-gray-900">
                      {format(new Date(profile.createdAt), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <Store className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-gray-600">Articles</span>
                    </div>
                    <span className="text-sm font-black text-gray-900">0</span>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-2xl shadow-indigo-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6" />
                  <h4 className="font-black tracking-tight">Sécurité</h4>
                </div>
                <p className="text-sm font-medium text-indigo-100 leading-relaxed mb-6">
                  Votre compte est protégé par MarketVibe. Assurez-vous de garder vos informations à jour.
                </p>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/10 p-3 rounded-xl">
                  <Globe className="w-4 h-4" />
                  Visibilité Publique
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
