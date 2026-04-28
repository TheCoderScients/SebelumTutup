import { PrismaClient, type PostCategory } from '@prisma/client';

const prisma = new PrismaClient();

const guests = [
  { nickname: 'SenjaKritis', isAnonymous: false },
  { nickname: 'PixelPulang', isAnonymous: false },
  { nickname: null, isAnonymous: true },
  { nickname: 'KopiDingin', isAnonymous: false },
  { nickname: 'NalarTipis', isAnonymous: false },
  { nickname: null, isAnonymous: true }
];

const posts: Array<{
  guest: number;
  title: string;
  body: string;
  category: PostCategory;
  anonymous?: boolean;
}> = [
  {
    guest: 0,
    title: 'Hot take: grup kelas lebih horor dari deadline',
    body: 'Satu pesan "guys mau tanya" jam 23.58 bisa bikin semua orang mendadak pura-pura tidur.',
    category: 'sekolah'
  },
  {
    guest: 1,
    title: 'Game paling seru tetap yang bisa bikin debat sehat',
    body: 'Grafik penting, tapi momen saling teriak karena strategi aneh itu yang bikin balik lagi.',
    category: 'game'
  },
  {
    guest: 2,
    title: 'Aku curiga semua orang capek tapi gengsi ngaku',
    body: 'Kadang yang dibutuhkan cuma satu hari tanpa jadi produktif, tanpa merasa bersalah.',
    category: 'curhat',
    anonymous: true
  },
  {
    guest: 3,
    title: 'Teknologi bagus kalau bikin kita punya waktu',
    body: 'Kalau malah bikin notifikasi makin galak, mungkin itu bukan kemajuan, cuma treadmill baru.',
    category: 'teknologi'
  },
  {
    guest: 4,
    title: 'Opini random: diam di lift itu budaya global',
    body: 'Manusia bisa bikin roket, tapi tetap tidak tahu harus lihat ke mana selama 18 detik di lift.',
    category: 'opini'
  },
  {
    guest: 5,
    title: 'Cinta paling realistis itu saling kirim bukti transfer parkir',
    body: 'Romantis boleh, tapi yang bertahan adalah yang ingat kamu belum makan dan baterai tinggal 8 persen.',
    category: 'cinta',
    anonymous: true
  },
  {
    guest: 0,
    title: 'Random banget: mie instan terbaik adalah yang dimasak orang lain',
    body: 'Rasanya beda. Ada elemen misterius bernama tidak perlu cuci panci.',
    category: 'random'
  },
  {
    guest: 3,
    title: 'Meeting 15 menit sering lebih jujur dari meeting 1 jam',
    body: 'Begitu waktunya sempit, semua orang mendadak ingat inti masalahnya apa.',
    category: 'opini'
  }
];

const comments = [
  'Ini terlalu nyata sampai sakit sedikit.',
  'Setuju, tapi aku tetap tim panik dulu baru mikir.',
  'Yang begini harusnya masuk poster kantor.',
  'Aku ketawa, lalu sadar aku bagian dari masalah.',
  'Pendapat ini ilegal tapi benar.',
  'Simpan dulu, besok aku debatkan.'
];

const emojis = ['🔥', '😂', '💀', '❤️'];

async function main() {
  await prisma.adminActionLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.postVote.deleteMany();
  await prisma.postReaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.guestSession.deleteMany();

  const guestRows = [];
  for (const guest of guests) {
    guestRows.push(
      await prisma.guestSession.create({
        data: {
          nickname: guest.nickname,
          isAnonymous: guest.isAnonymous,
          lastSeenAt: new Date()
        }
      })
    );
  }

  const postRows = [];
  for (const item of posts) {
    const guest = guestRows[item.guest];
    const isAnonymous = item.anonymous ?? guest.isAnonymous;
    postRows.push(
      await prisma.post.create({
        data: {
          guestSessionId: guest.id,
          displayName: isAnonymous ? 'Anonim' : guest.nickname || 'Anonim',
          isAnonymous,
          title: item.title,
          body: item.body,
          category: item.category
        }
      })
    );
  }

  for (let postIndex = 0; postIndex < postRows.length; postIndex += 1) {
    const post = postRows[postIndex];
    const commentTotal = (postIndex % 3) + 1;

    for (let i = 0; i < commentTotal; i += 1) {
      const guest = guestRows[(postIndex + i + 1) % guestRows.length];
      await prisma.comment.create({
        data: {
          postId: post.id,
          guestSessionId: guest.id,
          displayName: guest.isAnonymous ? 'Anonim' : guest.nickname || 'Anonim',
          isAnonymous: guest.isAnonymous,
          body: comments[(postIndex + i) % comments.length]
        }
      });
    }

    for (let i = 0; i < emojis.length; i += 1) {
      if ((postIndex + i) % 2 === 0 || postIndex < 3) {
        const guest = guestRows[(postIndex + i) % guestRows.length];
        await prisma.postReaction.create({
          data: {
            postId: post.id,
            guestSessionId: guest.id,
            emoji: emojis[i]
          }
        });
      }
    }

    let score = 0;
    for (let i = 0; i < 4; i += 1) {
      const guest = guestRows[(postIndex + i + 2) % guestRows.length];
      const value = (postIndex + i) % 4 === 0 ? -1 : 1;
      score += value;
      await prisma.postVote.upsert({
        where: {
          postId_guestSessionId: {
            postId: post.id,
            guestSessionId: guest.id
          }
        },
        update: { value },
        create: {
          postId: post.id,
          guestSessionId: guest.id,
          value
        }
      });
    }

    const [commentCount, reactionCount] = await Promise.all([
      prisma.comment.count({ where: { postId: post.id, deletedAt: null } }),
      prisma.postReaction.count({ where: { postId: post.id } })
    ]);

    await prisma.post.update({
      where: { id: post.id },
      data: { commentCount, reactionCount, score }
    });
  }

  await prisma.report.create({
    data: {
      targetType: 'post',
      targetId: postRows[1].id,
      reason: 'Contoh report untuk demo admin panel',
      reporterGuestSessionId: guestRows[2].id
    }
  });

  await prisma.adminActionLog.create({
    data: {
      actionType: 'seed',
      targetType: 'system',
      targetId: 'seed',
      note: 'Seed data demo dibuat'
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed data SebelumTutup selesai.');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
