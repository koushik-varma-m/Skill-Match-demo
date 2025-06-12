const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { createNotification } = require('./notification.controller');

const getAllJobPosts = async(req, res) => {
    try {
        const jobs = await prisma.job.findMany({
            include: {
                recruiter: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true,
                        profile: {
                            select: {
                                profilePicture: true
                            }
                        }
                    }
                },
                savedByCandidates: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json(jobs);
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const createJob = async (req, res) => {
    try {
        const { title, company, location, type, description, requirements, salary, skills, experience, education } = req.body;
        const recruiterId = req.user.id;

        // Convert requirements to array if it's a string
        const requirementsArray = typeof requirements === 'string' 
            ? requirements.split(',').map(req => req.trim())
            : Array.isArray(requirements) 
                ? requirements 
                : [];

        // Convert skills to array if it's a string
        const skillsArray = typeof skills === 'string'
            ? skills.split(',').map(skill => skill.trim())
            : Array.isArray(skills)
                ? skills
                : [];

        const jobData = {
            title,
            company,
            location,
            type,
            description,
            requirements: requirementsArray,
            salary,
            skills: skillsArray,
            experience,
            education,
            recruiterId
        };

        // Log the processed job data
        console.log('Processed job data:', jobData);

        const job = await prisma.job.create({
            data: jobData
        });

        // Get all connections of the recruiter
        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { senderId: recruiterId, status: 'ACCEPTED' },
                    { receiverId: recruiterId, status: 'ACCEPTED' },
                ],
            },
        });

        // Create notifications for all connections
        const notificationPromises = connections.map(connection => {
            const connectionUserId = connection.senderId === recruiterId ? connection.receiverId : connection.senderId;
            return createNotification(
                connectionUserId,
                'NEW_JOB',
                `${req.user.firstname} ${req.user.lastname} posted a new job: ${title}`
            );
        });

        await Promise.all(notificationPromises);

        res.status(201).json({
            message: "Job created successfully",
            job
        });
    } catch (error) {
        console.error('Detailed error in createJob:', error);
        res.status(500).json({
            message: "Error creating job",
            error: error.message
        });
    }
};

const getJobs = async (req, res) => {
  try {
    const { search, location, type, experience } = req.query;
    
    // Build the where clause based on search parameters
    const whereClause = {};
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { skills: { hasSome: [search] } }
      ];
    }
    
    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (experience) {
      whereClause.experience = experience;
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        recruiter: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            profile: {
              select: {
                profilePicture: true
              }
            }
          }
        },
        applications: req.user?.role === 'CANDIDATE' ? {
          where: {
            candidateId: req.user.id
          },
          select: {
            status: true
          }
        } : false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform jobs to include application status
    const transformedJobs = jobs.map(job => ({
      ...job,
      applicationStatus: job.applications?.[0]?.status || null,
      applications: undefined // Remove the applications array from the response
    }));
    
    res.status(200).json({
      message: 'Jobs retrieved successfully',
      jobs: transformedJobs
    });
  } catch (error) {
    console.error('Error in getJobs:', error);
    res.status(500).json({
      message: 'Failed to retrieve jobs',
      error: error.message
    });
  }
};

const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await prisma.job.findUnique({
      where: {
        id: Number(jobId)
      },
      include: {
        recruiter: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            profile: {
              select: {
                profilePicture: true
              }
            }
          }
        }
            }
        });

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    res.status(200).json({
      message: 'Job retrieved successfully',
      job
    });
  } catch (error) {
    console.error('Error in getJobById:', error);
    res.status(500).json({
      message: 'Failed to retrieve job',
      error: error.message
    });
  }
};

const getJobsByRecruiter = async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        recruiterId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.status(200).json({
      message: 'Jobs retrieved successfully',
      jobs
    });
  } catch (error) {
    console.error('Error in getJobsByRecruiter:', error);
    res.status(500).json({
      message: 'Failed to retrieve jobs',
      error: error.message
    });
  }
};

const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log('Updating job:', jobId);
    console.log('Request body:', req.body);

    const job = await prisma.job.findUnique({
      where: {
        id: Number(jobId)
      }
    });

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    // Check if user is the job poster
    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to update this job'
      });
    }

    // Process the update data
    const updateData = {
      ...req.body,
      skills: Array.isArray(req.body.skills) ? req.body.skills : [req.body.skills]
    };

    console.log('Processed update data:', updateData);

    // Validate required fields
    const requiredFields = ['title', 'company', 'location', 'type', 'description', 'requirements', 'skills', 'experience', 'education'];
    const missingFields = requiredFields.filter(field => !updateData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    try {
      const updatedJob = await prisma.job.update({
        where: {
          id: Number(jobId)
        },
        data: updateData
      });

      console.log('Successfully updated job:', updatedJob);

      res.status(200).json({
        message: 'Job updated successfully',
        job: updatedJob
      });
    } catch (prismaError) {
      console.error('Prisma error in updateJob:', prismaError);
      res.status(500).json({
        message: 'Database error while updating job',
        error: prismaError.message,
        code: prismaError.code
      });
    }
  } catch (error) {
    console.error('Error in updateJob:', error);
    res.status(500).json({
      message: 'Failed to update job',
      error: error.message,
      stack: error.stack
    });
    }
};

const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await prisma.job.findUnique({
      where: {
        id: Number(jobId)
      },
      include: {
        applications: true,
        savedByCandidates: true
      }
    });

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    // Check if user is the job poster
    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to delete this job'
      });
    }

    // Delete all related records first
    await prisma.$transaction([
      // Delete all applications for this job
      prisma.jobApplication.deleteMany({
        where: { jobId: Number(jobId) }
      }),
      // Remove all candidate connections
      prisma.job.update({
        where: { id: Number(jobId) },
        data: {
          savedByCandidates: {
            set: [] // This removes all connections
          }
        }
      }),
      // Finally delete the job
      prisma.job.delete({
        where: { id: Number(jobId) }
      })
    ]);

    res.status(200).json({
      message: 'Job and all related records deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteJob:', error);
    res.status(500).json({
      message: 'Failed to delete job',
      error: error.message
    });
  }
};

const applyForJob = async(req, res) => {
    try {
        const { jobId } = req.params;
        console.log('Files received:', req.file);
        console.log('Body received:', req.body);

        if (req.user.role !== 'CANDIDATE') {
            return res.status(403).json({ message: "Only candidates can apply for jobs" });
        }

        const job = await prisma.job.findUnique({
            where: { id: Number(jobId) },
            include: {
                savedByCandidates: {
                    select: { id: true }
                }
            }
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Check if already applied
        if (job.savedByCandidates.some(candidate => candidate.id === req.user.id)) {
            return res.status(400).json({ message: "You have already applied for this job" });
        }

        // Handle file upload
        if (!req.file) {
            console.log('No resume file found in request');
            return res.status(400).json({ message: "Resume is required" });
        }

        const resume = req.file;
        console.log('Resume file details:', {
            name: resume.originalname,
            size: resume.size,
            mimetype: resume.mimetype
        });

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        if (!allowedTypes.includes(resume.mimetype)) {
            return res.status(400).json({ 
                message: "Invalid file type. Only PDF, DOC, and DOCX files are allowed",
                receivedType: resume.mimetype
            });
        }

        if (resume.size > 5 * 1024 * 1024) { // 5MB limit
            return res.status(400).json({ 
                message: "File size too large. Maximum size is 5MB",
                receivedSize: resume.size
            });
        }

        // Prepare application data
        const applicationData = {
            jobId: Number(jobId),
            candidateId: req.user.id,
            coverLetter: req.body.coverLetter,
            resumePath: resume.filename,
            expectedSalary: req.body.expectedSalary || null,
            noticePeriod: req.body.noticePeriod || null,
            status: 'PENDING'
        };

        // Only add availableFrom if it's provided and valid
        if (req.body.availableFrom && req.body.availableFrom.trim() !== '') {
            const availableFromDate = new Date(req.body.availableFrom);
            if (!isNaN(availableFromDate.getTime())) {
                applicationData.availableFrom = availableFromDate;
            }
        }

        // Create application record
        const application = await prisma.jobApplication.create({
            data: applicationData
        });

        // Add candidate to savedByCandidates (applications)
        await prisma.job.update({
            where: { id: Number(jobId) },
            data: {
                savedByCandidates: {
                    connect: { id: req.user.id }
                }
            }
        });

        res.status(200).json({ 
            message: "Application submitted successfully",
            application
        });
    } catch(error) {
        console.error('Error in applyForJob:', error);
        res.status(500).json({ 
            message: "Failed to apply for job",
            error: error.message
        });
    }
};

const getMyApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const applications = await prisma.jobApplication.findMany({
            where: {
                candidateId: userId
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                        location: true,
                        type: true,
                        description: true,
                        requirements: true,
                        skills: true,
                        experience: true,
                        education: true,
                        salary: true,
                        recruiter: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                email: true,
                                profile: {
                                    select: {
                                        profilePicture: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            message: 'Applications retrieved successfully',
            applications
        });
    } catch (error) {
        console.error('Error in getMyApplications:', error);
        res.status(500).json({
            message: 'Failed to retrieve applications',
            error: error.message
        });
    }
};

// Get applications for recruiter's jobs
const getRecruiterApplications = async (req, res) => {
    try {
        const recruiterId = req.user.id;

        // Find all jobs posted by the recruiter
        const jobs = await prisma.job.findMany({
            where: { recruiterId },
            include: {
                applications: {
                    include: {
                        candidate: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        // Transform the data to get applications
        const applications = jobs.flatMap(job => 
            job.applications.map(application => ({
                id: application.id,
                status: application.status,
                coverLetter: application.coverLetter,
                resumeUrl: application.resumePath ? `/uploads/resumes/${application.resumePath}` : null,
                expectedSalary: application.expectedSalary,
                noticePeriod: application.noticePeriod,
                createdAt: application.createdAt,
                job: {
                    id: job.id,
                    title: job.title,
                    company: job.company
                },
                candidate: {
                    id: application.candidate.id,
                    name: `${application.candidate.firstname} ${application.candidate.lastname}`,
                    email: application.candidate.email
                }
            }))
        );

        res.json(applications);
    } catch (error) {
        console.error('Error fetching recruiter applications:', error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
};

// Update application status
const updateApplicationStatus = async(req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;
        const recruiterId = req.user.id;

        if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be one of: PENDING, ACCEPTED, REJECTED" });
        }

        // Get the application with job and candidate details
        const application = await prisma.jobApplication.findUnique({
            where: { id: Number(applicationId) },
            include: {
                job: true,
                candidate: true
            }
        });

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Verify that the job belongs to the recruiter
        if (application.job.recruiterId !== recruiterId) {
            return res.status(403).json({ message: "You are not authorized to update this application" });
        }

        // Update application status
        const updatedApplication = await prisma.jobApplication.update({
            where: { id: Number(applicationId) },
            data: { status }
        });

        // Send email notification based on status
        if (status === 'ACCEPTED' || status === 'REJECTED') {
            const emailData = {
                jobTitle: application.job.title,
                companyName: application.job.company
            };

            const template = status === 'ACCEPTED' 
                ? emailTemplates.applicationAccepted 
                : emailTemplates.applicationRejected;

            await sendEmail(application.candidate.email, template, emailData);
        }

        res.status(200).json({ 
            message: "Application status updated successfully",
            application: updatedApplication
        });
    } catch(error) {
        console.error('Error in updateApplicationStatus:', error);
        res.status(500).json({ 
            message: "Failed to update application status",
            error: error.message
        });
    }
}

module.exports = {
    getAllJobPosts,
    createJob,
    getJobs,
    getJobById,
    getJobsByRecruiter,
    updateJob,
    deleteJob,
    applyForJob,
    getMyApplications,
    getRecruiterApplications,
    updateApplicationStatus
};