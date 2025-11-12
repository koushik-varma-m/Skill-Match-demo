const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardStats(req, res) {
  try {
    const recruiterId = req.user.id;

    const activeJobs = await prisma.job.count({
      where: {
        recruiterId
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newApplications = await prisma.jobApplication.count({
      where: {
        job: {
          recruiterId
        },
        createdAt: {
          gte: today
        }
      }
    });

    const totalCandidates = await prisma.user.count({
      where: {
        role: 'CANDIDATE'
      }
    });

    res.json({
      activeJobs,
      newApplications,
      totalCandidates
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
}

module.exports = {
  getDashboardStats
};